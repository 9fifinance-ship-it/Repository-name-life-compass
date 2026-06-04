    const emailJobs = [
      sendEmail({
        to: email,
        subject: "Life Compass: đã nhận câu hỏi của bạn",
        html: welcomeEmail({ role, goal, urgency, sensitivity, tried })
      })
    ];

    if (process.env.OWNER_NOTIFY_EMAIL) {
      emailJobs.push(
        sendEmail({
          to: process.env.OWNER_NOTIFY_EMAIL,
          subject: `Lead mới: ${email}`,
          html: ownerEmail({ email, role, goal, urgency, sensitivity, tried })
        })
      );
    }

    const emailResults = await Promise.allSettled(emailJobs);
    const failedEmails = emailResults.filter((result) => result.status === "rejected");

    if (failedEmails.length) {
      console.error("Email delivery warning:", failedEmails.map((result) => result.reason));
    }

    return json(res, 200, {
      message: failedEmails.length
        ? "Đã nhận nhu cầu. Email xác nhận sẽ được xử lý lại sau."
        : "Đã nhận nhu cầu. Email xác nhận đang được gửi tới bạn."
    });
