const form = document.querySelector("#login-form");
const statusEl = document.querySelector("#login-status");

const setStatus = (message, state = "") => {
  statusEl.textContent = message;
  statusEl.className = `form-status ${state}`.trim();
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  submitButton.disabled = true;
  submitButton.textContent = "Đang gửi...";
  setStatus("Đang tạo link đăng nhập.");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không gửi được link đăng nhập.");
    }

    localStorage.setItem("lifeCompassEmail", payload.email);
    form.reset();
    setStatus(data.message || "Đã gửi link đăng nhập. Kiểm tra email nhé.", "success");
  } catch (error) {
    setStatus(error.message || "Có lỗi khi gửi link. Thử lại sau ít phút.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Gửi link đăng nhập";
  }
});
