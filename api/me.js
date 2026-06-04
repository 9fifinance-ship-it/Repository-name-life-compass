const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return json(res, 401, { message: "Chưa đăng nhập." });
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return json(res, 401, { message: "Phiên đăng nhập hết hạn." });
    }

    const user = await response.json();
    return json(res, 200, {
      email: user.email,
      id: user.id,
      created_at: user.created_at
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { message: "Chưa đọc được phiên đăng nhập." });
  }
}
