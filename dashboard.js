const statusEl = document.querySelector("#dashboard-status");
const sessionStateEl = document.querySelector("#session-state");
const emailEl = document.querySelector("#profile-email");
const introEl = document.querySelector("#dashboard-intro");
const logoutButton = document.querySelector("#logout-button");

const setStatus = (message, state = "") => {
  statusEl.textContent = message;
  statusEl.className = `form-status ${state}`.trim();
};

const readHashSession = () => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresAt = params.get("expires_at");

  if (!accessToken) return null;

  const session = {
    accessToken,
    refreshToken,
    expiresAt
  };

  localStorage.setItem("lifeCompassSession", JSON.stringify(session));
  window.history.replaceState({}, document.title, window.location.pathname);
  return session;
};

const readStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem("lifeCompassSession") || "null");
  } catch {
    return null;
  }
};

const loadProfile = async (session) => {
  const response = await fetch("/api/me", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Phiên đăng nhập hết hạn.");
  }

  return data;
};

const boot = async () => {
  const session = readHashSession() || readStoredSession();

  if (!session?.accessToken) {
    sessionStateEl.textContent = "Signed out";
    introEl.textContent = "Bạn chưa đăng nhập. Hãy yêu cầu magic link để vào lại hồ sơ.";
    setStatus("Chưa có phiên đăng nhập. Quay lại trang đăng nhập để nhận link.", "error");
    return;
  }

  try {
    const profile = await loadProfile(session);
    sessionStateEl.textContent = "Signed in";
    emailEl.textContent = profile.email || localStorage.getItem("lifeCompassEmail") || "Đã xác thực";
    introEl.textContent = "Bạn đã đăng nhập. Hồ sơ hiện ở trạng thái chờ đọc bối cảnh.";
    setStatus("Phiên đăng nhập hợp lệ.", "success");
  } catch (error) {
    localStorage.removeItem("lifeCompassSession");
    sessionStateEl.textContent = "Expired";
    setStatus(error.message || "Phiên đăng nhập hết hạn.", "error");
  }
};

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem("lifeCompassSession");
  sessionStateEl.textContent = "Signed out";
  emailEl.textContent = "Chưa có";
  setStatus("Đã đăng xuất trên trình duyệt này.", "success");
});

boot();
