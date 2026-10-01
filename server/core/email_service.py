import logging
from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape

logger = logging.getLogger(__name__)


def send_institutional_otp_email(to_email: str, otp_code: str, full_name: str = None) -> tuple[bool, str | None]:
    """
    Sends a university-branded HTML verification email with a 6-digit OTP.
    Returns (success: bool, error_message: str | None).
    """
    subject = f"[DBUU ARIS] Your Institutional Verification Code: {otp_code}"
    greeting_name = escape(full_name) if full_name else "Student / Scholar"
    clean_email = escape(to_email)
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Dev Bhoomi Uttarakhand University <noreply@dbuu.ac.in>')

    text_message = (
        f"Dev Bhoomi Uttarakhand University - ARIS Portal\n"
        f"Institutional Identity Verification\n\n"
        f"Hello {greeting_name},\n\n"
        f"Your one-time verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes. Please enter this code on the ARIS registration page to complete your identity verification.\n\n"
        f"If you did not initiate this request, please disregard this email or notify the DBUU IT cell.\n\n"
        f"Regards,\n"
        f"ARIS Automated Notification Desk\n"
        f"Dev Bhoomi Uttarakhand University, Dehradun"
    )

    html_message = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DBUU ARIS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Crimson Brand Ribbon -->
          <tr>
            <td style="background-color: #B81D24; padding: 22px 30px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                      Dev Bhoomi Uttarakhand University
                    </div>
                    <div style="color: #fecdd3; font-size: 15px; font-weight: 700; margin-top: 2px;">
                      ARIS Institutional Repository &amp; Academic System
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Sub-header Ribbon -->
          <tr>
            <td style="background-color: #0F2137; padding: 8px 30px; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Single-Sign-On &bull; Identity Authentication Protocol
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 30px 25px 30px;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                Verification Code
              </h2>
              <p style="margin: 0 0 18px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Dear <strong>{greeting_name}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                You have requested a secure One-Time Password (OTP) to verify your institutional email address (<strong>{clean_email}</strong>) on the ARIS Academic Platform. Use the official code below to complete authentication:
              </p>

              <!-- Highlighted OTP Code Block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 25px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #B81D24; border-radius: 8px; padding: 18px 36px; text-align: center;">
                      <div style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
                        One-Time Security Code
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #B81D24;">
                        {otp_code}
                      </div>
                      <div style="color: #94a3b8; font-size: 11px; font-weight: 500; margin-top: 6px;">
                        Valid for 10 minutes only
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Alert Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border-left: 4px solid #B81D24; padding: 12px 16px; margin-bottom: 24px; border-radius: 2px;">
                <tr>
                  <td style="color: #9f1239; font-size: 12px; line-height: 1.5;">
                    <strong>Security Notice:</strong> DBUU Faculty or System Administrators will never ask for your verification code. Never share this code with anyone.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                If you did not make this request, please ignore this email or reach out to the university IT desk immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
              <div style="color: #64748b; font-size: 11px; font-weight: 600;">
                Dev Bhoomi Uttarakhand University &bull; Dehradun, Uttarakhand &bull; PIN: 248007
              </div>
              <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">
                Automated System Dispatch &bull; Please do not reply directly to this email
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=from_email,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Institutional OTP email successfully dispatched to {to_email}")
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Failed to dispatch OTP email to {to_email}: {err_msg}")
        return False, err_msg


def send_deadline_announcement_email(
    student_email: str,
    student_name: str,
    track_title: str,
    deadline_type_display: str,
    due_date_str: str,
    instructions: str = "",
    template_url: str = "",
    template_filename: str = "",
    department: str = "Department of Computer Applications"
) -> bool:
    """
    Sends a university-branded milestone deadline announcement email with download link and instructions.
    """
    subject = f"[DBUU ARIS Notice] {track_title}: Official Deadline for {deadline_type_display}"
    safe_name = escape(student_name) if student_name else "Student"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Dev Bhoomi Uttarakhand University <noreply@dbuu.ac.in>')

    text_message = (
        f"Dev Bhoomi Uttarakhand University\n"
        f"{department}\n\n"
        f"OFFICIAL MILESTONE SUBMISSION NOTICE\n\n"
        f"Dear {safe_name},\n\n"
        f"A submission deadline has been announced for your project track:\n"
        f"Track: {track_title}\n"
        f"Deliverable: {deadline_type_display}\n"
        f"Submission Due Date: {due_date_str}\n\n"
    )

    if instructions:
        text_message += f"Guidelines & Instructions:\n{instructions}\n\n"
    if template_url:
        text_message += f"Format Template: {template_url} ({template_filename or 'Official Template'})\n\n"

    text_message += (
        "All enrolled project groups must submit deliverables via the ARIS portal before the deadline.\n\n"
        "Regards,\nOffice of Head of Department\nDev Bhoomi Uttarakhand University"
    )

    instructions_html = ""
    if instructions:
        escaped_instr = escape(instructions).replace('\n', '<br>')
        instructions_html = f"""
        <div style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 4px; padding: 16px;">
          <div style="color: #1e3a8a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
            HOD / Faculty Guidelines &amp; Instructions
          </div>
          <div style="color: #334155; font-size: 13px; line-height: 1.6;">
            {escaped_instr}
          </div>
        </div>
        """

    template_button_html = ""
    if template_url:
        safe_tmpl_name = escape(template_filename) if template_filename else "Download Official Template"
        template_button_html = f"""
        <div style="margin: 25px 0 15px 0; text-align: center;">
          <a href="{escape(template_url)}" target="_blank" style="display: inline-block; background-color: #B81D24; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 26px; border-radius: 4px; box-shadow: 0 2px 6px rgba(184, 29, 36, 0.3);">
            &#128196; {safe_tmpl_name}
          </a>
          <div style="color: #64748b; font-size: 11px; margin-top: 6px;">
            Click to download the official university deliverable format
          </div>
        </div>
        """

    html_message = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DBUU ARIS Deadline Announcement</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Crimson Top Header -->
          <tr>
            <td style="background-color: #B81D24; padding: 22px 30px; text-align: left;">
              <div style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                Dev Bhoomi Uttarakhand University
              </div>
              <div style="color: #fecdd3; font-size: 15px; font-weight: 700; margin-top: 2px;">
                {escape(department)} &bull; ARIS Portal
              </div>
            </td>
          </tr>

          <!-- Notice Bar -->
          <tr>
            <td style="background-color: #0F2137; padding: 10px 30px; color: #f8fafc; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              Official Notice: Milestone Submission Deadline
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0 0 14px 0; color: #334155; font-size: 14px;">
                Dear <strong>{safe_name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                An official deadline has been published for your project track by the Head of Department. All group members must coordinate and submit the required deliverable on or before the due date.
              </p>

              <!-- Milestone Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecdd3; border-radius: 6px; margin: 15px 0 20px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="color: #991b1b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
                      Academic Milestone Notice
                    </div>
                    <div style="color: #0f172a; font-size: 18px; font-weight: 900; margin: 4px 0 8px 0;">
                      {escape(deadline_type_display)}
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px; font-size: 13px;">
                      <tr>
                        <td style="color: #64748b; padding: 4px 0; width: 110px;"><strong>Project Track:</strong></td>
                        <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">{escape(track_title)}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 4px 0;"><strong>Due Date &amp; Time:</strong></td>
                        <td style="color: #B81D24; padding: 4px 0; font-weight: 800; font-size: 14px;">{escape(due_date_str)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              {instructions_html}

              {template_button_html}

              <div style="margin-top: 25px; padding: 12px 16px; background-color: #f1f5f9; border-radius: 4px; color: #64748b; font-size: 12px; line-height: 1.5;">
                <strong>Notice on Timely Submission:</strong> Deliverables must be uploaded directly via the student workspace in ARIS. Submissions uploaded after the deadline will be flagged for review during faculty supervisor evaluation.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; text-align: center;">
              <div style="color: #64748b; font-size: 11px; font-weight: 600;">
                Office of Head of Department &bull; Dev Bhoomi Uttarakhand University
              </div>
              <div style="color: #94a3b8; font-size: 10px; margin-top: 3px;">
                ARIS Academic Repository &bull; Automated Institutional Notification
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=from_email,
            recipient_list=[student_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Deadline announcement email sent to {student_email} for {track_title}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch deadline email to {student_email}: {str(e)}")
        return False
