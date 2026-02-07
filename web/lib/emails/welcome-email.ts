export const welcomeEmail = (email: string) => ({
  from: 'Discloser <hello@discloser.app>',
  to: email,
  subject: 'Welcome to Discloser',
  html: `
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to Discloser</title>
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
    /* Dark mode support for email clients that support it */
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0D0B0E !important; }
    }
    /* Mobile */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .hero-title { font-size: 26px !important; line-height: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0D0B0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Preview text (visible in inbox, hidden in email body) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    You're in. Your privacy is in good hands.
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

                    <!-- Sparkle icon -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <div style="width: 56px; height: 56px; border-radius: 16px; background-color: rgba(146, 61, 92, 0.25); line-height: 56px; text-align: center; font-size: 26px;">
                            &#x2728;
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <h1 class="hero-title" style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; line-height: 34px; letter-spacing: -0.02em;">Welcome to Discloser</h1>
                        </td>
                      </tr>
                    </table>

                    <!-- Body text -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <p style="margin: 0; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.6);">
                            You just made sharing safer. From here on out, your results stay yours. No names, no screenshots, no stress.
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

                    <!-- Next step nudge -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85);">
                            Ready when you are
                          </p>
                          <p style="margin: 0; font-size: 14px; line-height: 22px; color: rgba(255,255,255,0.45);">
                            Add your first test result. It only takes a minute.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td align="center" style="border-radius: 14px; background: linear-gradient(135deg, #FF2D7A 0%, #923D5C 100%);">
                                <a href="discloser://" target="_blank" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none; letter-spacing: -0.01em;">
                                  Open Discloser &rarr;
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- What to expect -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(146, 61, 92, 0.1); border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <!-- Row 1 -->
                            <tr>
                              <td width="28" style="vertical-align: top; padding-top: 1px;">
                                <span style="font-size: 14px;">&#x1F4F7;</span>
                              </td>
                              <td style="padding-bottom: 12px;">
                                <span style="font-size: 13px; color: rgba(255,255,255,0.55);">Upload a photo of your results. We'll read it for you</span>
                              </td>
                            </tr>
                            <!-- Row 2 -->
                            <tr>
                              <td width="28" style="vertical-align: top; padding-top: 1px;">
                                <span style="font-size: 14px;">&#x1F517;</span>
                              </td>
                              <td style="padding-bottom: 12px;">
                                <span style="font-size: 13px; color: rgba(255,255,255,0.55);">Share a secure link that expires on your terms</span>
                              </td>
                            </tr>
                            <!-- Row 3 -->
                            <tr>
                              <td width="28" style="vertical-align: top; padding-top: 1px;">
                                <span style="font-size: 14px;">&#x1F440;</span>
                              </td>
                              <td>
                                <span style="font-size: 13px; color: rgba(255,255,255,0.55);">Your name never leaves the app</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Bottom spacing -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 16px;">&nbsp;</td>
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
                You're receiving this because you just created an account.
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.15); font-style: italic;">
                Share your status. Keep your name.
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
