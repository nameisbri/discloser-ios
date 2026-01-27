export const waitlistWelcomeEmail = (email: string) => ({
  from: 'Discloser <hello@updates.discloser.app>',
  to: email,
  subject: 'You\'re on the list!',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #2c3e50; max-width: 600px; margin: 0 auto; padding: 16px;">

          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 20px 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <img src="https://discloser.app/logo.png" alt="Discloser" style="width: 50px; height: 50px; margin-bottom: 12px; border-radius: 10px;" />
            <h2 style="color: white; margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">You're on the list!</h2>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">We'll let you know when Discloser is ready.</p>
          </div>

          <!-- Main Content -->
          <div style="background: #ffffff; padding: 24px 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">

            <!-- Intro -->
            <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Right now, proving you're negative means showing your full name, date of birth, address... basically your whole life... to someone who might not even remember your name tomorrow.
            </p>

            <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Being responsible shouldn't cost you your privacy. That's why we're building Discloser.
            </p>

            <!-- Survey CTA -->
            <div style="margin-bottom: 20px; padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center;">
              <h3 style="color: white; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">
                Help us build the right thing
              </h3>
              <p style="color: rgba(255, 255, 255, 0.95); font-size: 13px; line-height: 1.5; margin: 0 0 14px 0;">
                Got 2 minutes? Your feedback will directly shape what we build.
              </p>
              <a href="https://tally.so/r/Gx9WqQ" style="display: inline-block; background: white; color: #667eea; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Take the Survey
              </a>
            </div>

            <!-- What you'll get -->
            <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%); border-radius: 8px; border-left: 3px solid #667eea;">
              <h3 style="color: #2c3e50; font-size: 15px; font-weight: 600; margin: 0 0 10px 0;">
                What you'll get:
              </h3>
              <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0;">
                ✓ Share your status without revealing your identity<br>
                ✓ Time-limited links that expire when you want<br>
                ✓ Testing reminders so you never miss a date<br>
                ✓ Zero screenshots. Zero data selling. Just privacy.
              </p>
            </div>

            <!-- Share -->
            <div style="margin-bottom: 18px; padding: 14px; background-color: #f8f9fa; border-radius: 6px;">
              <p style="color: #2c3e50; font-size: 13px; line-height: 1.5; margin: 0;">
                <strong>Know someone who'd want this?</strong><br>
                Share <a href="https://discloser.app" style="color: #667eea; text-decoration: none; font-weight: 600;">discloser.app</a> with them.
              </p>
            </div>

            <!-- Closing -->
            <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0;">
              Talk soon,<br>
              <strong style="color: #667eea;">The Discloser Team</strong>
            </p>

            <!-- Footer -->
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e0e0e0; text-align: center;">
              <p style="color: #95a5a6; font-size: 11px; margin: 0;">
                <a href="https://discloser.app" style="color: #667eea; text-decoration: none; font-weight: 600;">discloser.app</a> · You're in for early access
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
});
