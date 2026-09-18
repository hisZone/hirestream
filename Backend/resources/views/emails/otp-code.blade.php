<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
                    <tr>
                        <td style="padding: 32px 40px 8px 40px;">
                            <h1 style="font-size:18px; color:#111827; margin:0;">HireStream</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 40px 24px 40px;">
                            <p style="font-size:15px; color:#374151; line-height:1.5; margin:0 0 24px 0;">
                                Use the code below to continue. This code expires in {{ $expiryMinutes }} minutes.
                            </p>
                            <div style="background-color:#f3f4f6; border-radius:8px; padding:20px; text-align:center;">
                                <span style="font-size:32px; letter-spacing:8px; font-weight:600; color:#111827;">{{ $code }}</span>
                            </div>
                            <p style="font-size:13px; color:#9ca3af; line-height:1.5; margin:24px 0 0 0;">
                                If you didn't request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
