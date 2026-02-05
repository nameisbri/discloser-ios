export const waitlistWelcomeEmail = (email: string) => ({
  from: 'Discloser <hello@discloser.app>',
  to: email,
  subject: "You're on the list!",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You're on the list!</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0D0B0E !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .hero-title { font-size: 26px !important; line-height: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0D0B0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    We'll let you know when Discloser is ready. Help shape what we build.
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
  </div>

  <!-- Full-width background wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0D0B0E;" class="email-bg">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" class="email-container" style="max-width: 480px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img src="https://discloser.app/logo.png" alt="Discloser" width="36" height="36" style="display: block; border-radius: 10px;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.02em;">Discloser</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card body -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #1A1520 0%, #2D2438 100%); border-radius: 20px; border: 1px solid #3D3548;">
                <tr>
                  <td class="email-padding" style="padding: 44px 40px 20px 40px;">

                    <!-- Celebration icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <div style="width: 56px; height: 56px; border-radius: 16px; background-color: rgba(146, 61, 92, 0.25); line-height: 56px; text-align: center; font-size: 26px;">
                            &#x1F389;
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <h1 class="hero-title" style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; line-height: 34px; letter-spacing: -0.02em;">You're on the list!</h1>
                        </td>
                      </tr>
                    </table>

                    <!-- Subheading -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <p style="margin: 0; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.6);">
                            We'll let you know when Discloser is ready.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <div style="height: 1px; background: linear-gradient(90deg, transparent, #3D3548 20%, #3D3548 80%, transparent);"></div>
                        </td>
                      </tr>
                    </table>

                    <!-- Body text -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.75);">
                            Right now, proving you're negative means showing your full name, date of birth, address... basically your whole life... to someone who might not even remember your name tomorrow.
                          </p>
                          <p style="margin: 0; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.75);">
                            Being responsible shouldn't cost you your privacy. That's why we're building Discloser.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Survey CTA -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, rgba(255,45,122,0.15) 0%, rgba(146,61,92,0.15) 100%); border-radius: 14px; border: 1px solid rgba(255,45,122,0.2);">
                            <tr>
                              <td style="padding: 24px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                  <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FFFFFF;">Help us build the right thing</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center" style="padding-bottom: 16px;">
                                      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.6);">Got 2 minutes? Your feedback will directly shape what we build.</p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center">
                                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                          <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #FF2D7A 0%, #923D5C 100%);">
                                            <a href="https://tally.so/r/Gx9WqQ" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                                              Take the Survey &rarr;
                                            </a>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- What you'll get -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-radius: 14px; border-left: 3px solid #FF2D7A;">
                            <tr>
                              <td style="padding: 20px 24px;">
                                <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #FFFFFF;">What you'll get:</p>
                                <p style="margin: 0; font-size: 14px; line-height: 26px; color: rgba(255,255,255,0.7);">
                                  &#x2713; Share your status without revealing your identity<br />
                                  &#x2713; Time-limited links that expire when you want<br />
                                  &#x2713; Testing reminders so you never miss a date<br />
                                  &#x2713; Zero screenshots. Zero data selling. Just privacy.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Share section -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255,255,255,0.03); border-radius: 14px;">
                            <tr>
                              <td style="padding: 16px 24px;">
                                <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                                  <strong style="color: rgba(255,255,255,0.85);">Know someone who'd want this?</strong><br />
                                  Share <a href="https://discloser.app" style="color: #FF2D7A; text-decoration: none; font-weight: 600;">discloser.app</a> with them.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Closing -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <p style="margin: 0; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.75);">
                            Talk soon,<br />
                            <strong style="color: #FF2D7A;">The Discloser Team</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: rgba(255,255,255,0.25);">
                Sent by Discloser &middot; Privacy-first health sharing
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: rgba(255,255,255,0.25);">
                You're in for early access.
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.15); font-style: italic;">
                Be adventurous. Stay anonymous.
              </p>
            </td>
          </tr>

        </table>
        <!-- End main container -->

      </td>
    </tr>
  </table>

</body>
</html>
  `
});
