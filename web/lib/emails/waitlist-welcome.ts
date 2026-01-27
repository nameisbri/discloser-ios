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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">You're on the list! 🎉</h1>
        </div>

        <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">Thanks for joining the Discloser waitlist.</p>

          <p style="font-size: 16px; margin-bottom: 20px;">We're building a safe, private way to share your sexual health status. You'll be among the first to know when we launch.</p>

          <p style="font-size: 16px; margin-bottom: 30px;">In the meantime, feel free to share Discloser with friends who might be interested.</p>

          <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 14px; color: #666; margin: 0;">- The Discloser Team</p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>You received this email because you signed up for the Discloser waitlist.</p>
        </div>
      </body>
    </html>
  `
});
