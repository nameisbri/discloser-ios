export const waitlistWelcomeEmail = (email: string) => ({
  from: 'Discloser <hello@updates.discloser.app>',
  to: email,
  subject: 'Welcome to the Discloser Waitlist!',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #2c3e50; max-width: 600px; margin: 0 auto; padding: 20px;">

          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://discloser.app/logo.png" alt="Discloser" style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px;" />
            <h2 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">You're on the list!</h2>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Thank you for joining the Discloser waitlist</p>
          </div>

          <!-- Main Content -->
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">

            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
              <p style="color: #2c3e50; font-size: 14px; line-height: 1.7; margin: 0 0 15px 0;">
                We're building a <strong>privacy-first app</strong> for sharing your sexual health status securely—no identity exposure, no data selling, just safe and confident connections.
              </p>
            </div>

            <!-- What Happens Next -->
            <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%); border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="color: #2c3e50; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                What Happens Next?
              </h3>
              <ul style="color: #2c3e50; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">You'll be among the <strong>first to know</strong> when we launch</li>
                <li style="margin-bottom: 8px;">Get <strong>early access</strong> before the public release</li>
                <li style="margin-bottom: 8px;">Receive updates on our progress and features</li>
              </ul>
            </div>

            <!-- Survey CTA -->
            <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
              <h3 style="color: white; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                Help Us Build the Right Product
              </h3>
              <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.7; margin: 0 0 20px 0;">
                Take 2 minutes to share your thoughts. Your feedback will directly shape Discloser's features and design.
              </p>
              <a href="https://tally.so/r/Gx9WqQ" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Take the Survey
              </a>
            </div>

            <!-- Why Discloser -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #2c3e50; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                Why Discloser?
              </h3>
              <ul style="color: #2c3e50; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>Anonymous sharing</strong> - Share your status without revealing your identity</li>
                <li style="margin-bottom: 8px;"><strong>Time-limited links</strong> - Control who sees your results and for how long</li>
                <li style="margin-bottom: 8px;"><strong>Testing reminders</strong> - Stay on top of your sexual health</li>
                <li style="margin-bottom: 8px;"><strong>Privacy-first</strong> - Your data stays yours, always</li>
              </ul>
            </div>

            <!-- Share -->
            <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
              <p style="color: #2c3e50; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                Help us spread the word:
              </p>
              <p style="color: #2c3e50; font-size: 14px; line-height: 1.7; margin: 0;">
                Know someone who'd benefit from safer, more private STI status sharing? Share <a href="https://discloser.app" style="color: #667eea; text-decoration: none; font-weight: 600;">discloser.app</a> with them.
              </p>
            </div>

            <!-- Closing -->
            <div style="margin-bottom: 20px;">
              <p style="color: #2c3e50; font-size: 14px; line-height: 1.7; margin: 0 0 10px 0;">
                We're excited to have you join us on this journey toward safer, more confident connections.
              </p>
              <p style="color: #2c3e50; font-size: 14px; line-height: 1.7; margin: 0;">
                Best,<br>
                <strong style="color: #667eea;">The Discloser Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #e0e0e0; text-align: center;">
              <p style="color: #95a5a6; font-size: 12px; margin: 0 0 5px 0;">
                <a href="https://discloser.app" style="color: #667eea; text-decoration: none; font-weight: 600;">discloser.app</a>
              </p>
              <p style="color: #95a5a6; font-size: 11px; margin: 0;">
                You received this email because you signed up for the Discloser waitlist.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
});
