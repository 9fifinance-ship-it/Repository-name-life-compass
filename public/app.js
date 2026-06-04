const form = document.querySelector("#lead-form");
const statusEl = document.querySelector("#form-status");

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
  setStatus("Đang lưu nhu cầu của bạn.");

  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không gửi được form.");
    }

    form.reset();
    setStatus(data.message || "Đã nhận nhu cầu. Kiểm tra email của bạn nhé.", "success");
  } catch (error) {
    setStatus(error.message || "Có lỗi khi gửi form. Thử lại sau ít phút.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Gửi nhu cầu";
  }
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    const topic = button.dataset.topic;

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".topic-card").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.topicPanel === topic);
    });
  });
});
