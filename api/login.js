const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

async function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { message: "Method not allowed" });
  }

  try {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();

    if (!isEmail(email)) {
      return json(res, 400, { message: "Điền email hợp lệ để nhận link đăng nhập." });
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const siteUrl = process.env.PUBLIC_SITE_URL || "http://localhost:4173";

    const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        should_create_user: true,
        data: {
          source: "life-compass-login"
        },
        email_redirect_to: `${siteUrl}/dashboard.html`
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase login failed: ${detail}`);
    }

    return json(res, 200, {
      message: "Link đăng nhập đã được gửi. Kiểm tra hộp thư của bạn nhé."
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      message: "Chưa gửi được link đăng nhập. Kiểm tra cấu hình Supabase."
    });
  }
}
