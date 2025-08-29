export class EmailService {
  // In test mode we keep a map of last tokens sent per email so tests can assert on them.
  private lastSent: Record<string, { token: string; sentAt: string }> = {};

  // Simulate sending a password reset email.
  // In production replace this with an SMTP/sendgrid/etc provider implementation.
  async sendPasswordReset(email: string, token: string) {
    console.log(`Sending password reset to ${email}: token=${token}`);
    if (process.env.NODE_ENV === 'test') {
      this.lastSent[email] = { token, sentAt: new Date().toISOString() };
    }
    // In real-world you'd return a message id or similar
    return { ok: true };
  }

  // Test helper to retrieve last token sent to an address
  getLastToken(email: string) {
    return this.lastSent[email];
  }

  // Clear stored tokens (used between tests)
  clear() {
    this.lastSent = {};
  }
}
