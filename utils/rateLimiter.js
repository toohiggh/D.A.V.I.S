const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../databases/rateLimiter.db');
const db = new Database(dbPath);

// Create tables for rate-limiting
db.exec(`
    CREATE TABLE IF NOT EXISTS email_attempts (
        userId TEXT NOT NULL,
        email TEXT NOT NULL,
        lastAttempt INTEGER NOT NULL,
        attemptCount INTEGER DEFAULT 0,
        emailLockTimestamp INTEGER DEFAULT 0,
        PRIMARY KEY (userId)
    );
`);

// Remove duplicate rows
try {
    db.exec(`
        DELETE FROM email_attempts
        WHERE rowid NOT IN (
            SELECT MIN(rowid)
            FROM email_attempts
            GROUP BY userId
        );
    `);
    console.log('Duplicate rows removed from email_attempts table.');
} catch (error) {
    console.error('Error removing duplicate rows:', error);
}

// Add unique constraint on userId
try {
    db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_userId ON email_attempts (userId);
    `);
    console.log('Unique constraint added to userId.');
} catch (error) {
    console.error('Error adding unique constraint on userId:', error);
}

// Ensure the `otpCooldownTimestamp` column exists
try {
    db.exec(`
        ALTER TABLE email_attempts
        ADD COLUMN otpCooldownTimestamp INTEGER DEFAULT 0;
    `);
    console.log('otpCooldownTimestamp column added to email_attempts table.');
} catch (error) {
    if (!error.message.includes('duplicate column name')) {
        console.error('Error adding otpCooldownTimestamp column:', error);
    }
}

/**
 * Check and update email attempts for a user.
 * @param {string} userId - The Discord user ID.
 * @param {string} email - The email being verified.
 * @param {number} cooldown - The cooldown duration in milliseconds.
 * @returns {Object} { allowed: boolean, retryAfter: number }
 */
function checkEmailRateLimit(userId, email, cooldown = 3 * 60 * 1000) {
    const now = Date.now();
    const stmt = db.prepare('SELECT * FROM email_attempts WHERE userId = ?');
    const record = stmt.get(userId);

    if (record && record.email === email) {
        const timeSinceLastOtp = now - record.OtpCooldownTimestamp;

        // If within cooldown, reject
        if (timeSinceLastOtp < cooldown) {
            return { allowed: false, retryAfter: cooldown - timeSinceLastOtp };
        }

        // Update attempt timestamp
        const updateStmt = db.prepare(`
            UPDATE email_attempts 
            SET otpCooldownTimestamp = ?
            WHERE userId = ?
        `);
        updateStmt.run(now, userId);
        return { allowed: true, retryAfter: 0 };
    }

    // First attempt for this user/email
    const insertStmt = db.prepare(`
        INSERT INTO email_attempts (userId, email, lastAttempt, otpCooldownTimestamp, attemptCount, emailLockTimestamp) 
        VALUES (?, ?, ?, ?, 1, 0)
    `);
    insertStmt.run(userId, email, now);
    return { allowed: true, retryAfter: 0 };
}

/**
 * Check if the user is locked from changing their email.
 * @param {string} userId - The Discord user ID.
 * @param {number} lockDuration - Duration in milliseconds (default 10 minutes).
 * @returns {Object} { allowed: boolean, retryAfter: number }
 */
function checkEmailLock(userId, lockDuration = 10 * 60 * 1000) {
    const now = Date.now();
    const stmt = db.prepare('SELECT emailLockTimestamp FROM email_attempts WHERE userId = ?');
    const record = stmt.get(userId);

    if (record && record.emailLockTimestamp > now) {
        return { allowed: false, retryAfter: record.emailLockTimestamp - now };
    }

    return { allowed: true, retryAfter: 0 };
}

/**
 * Lock the user's email for a specified duration.
 * @param {string} userId - The Discord user ID.
 * @param {string} email - The email being locked.
 * @param {number} lockDuration - Duration in milliseconds.
 */
function lockEmail(userId, email, lockDuration = 10 * 60 * 1000) {
    const lockUntil = Date.now() + lockDuration;

    const stmt = db.prepare(`
        INSERT INTO email_attempts (userId, email, lastAttempt, emailLockTimestamp) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userId) DO UPDATE 
        SET email = excluded.email, 
            lastAttempt = excluded.lastAttempt, 
            emailLockTimestamp = excluded.emailLockTimestamp
    `);
    stmt.run(userId, email, Date.now(), lockUntil);
}

/**
 * Reset email attempts for a user.
 * @param {string} userId - The Discord user ID.
 */
function resetEmailAttempts(userId) {
    const stmt = db.prepare('DELETE FROM email_attempts WHERE userId = ?');
    stmt.run(userId);
}

module.exports = {
    db,
    checkEmailRateLimit,
    resetEmailAttempts,
    checkEmailLock,
    lockEmail,
};