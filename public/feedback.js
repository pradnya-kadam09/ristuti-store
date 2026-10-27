/* ==========================================================================
   RISTUTI HAUTE COUTURE - FEEDBACK CLIENT SCRIPT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("message");
  const charCount = document.getElementById("charCount");
  const starPicker = document.getElementById("starPicker");
  const ratingInput = document.getElementById("ratingInput");
  const form = document.getElementById("feedbackForm");
  const doneBox = document.getElementById("feedbackDone");
  const sendBtn = document.getElementById("sendFeedback");
  const toastEl = document.getElementById("toast");

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  // Character counter
  if (messageInput && charCount) {
    messageInput.addEventListener("input", () => {
      charCount.textContent = messageInput.value.length;
    });
  }

  // Star Rating
  if (starPicker && ratingInput) {
    starPicker.addEventListener("click", (e) => {
      const btn = e.target.closest(".star-btn");
      if (!btn) return;
      const rating = Number(btn.dataset.star);
      ratingInput.value = rating;
      document.querySelectorAll(".star-btn").forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.star) <= rating);
      });
    });
  }

  // Form Submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (text.length < 10) {
        return toast("Please write at least 10 characters.");
      }

      sendBtn.disabled = true;
      sendBtn.innerHTML = `<span>Sending...</span>`;

      const payload = {
        name: form.name.value.trim(),
        contact: form.contact.value.trim(),
        type: form.type.value,
        rating: ratingInput.value ? Number(ratingInput.value) : null,
        message: text
      };

      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not submit feedback.");

        form.style.display = "none";
        doneBox.classList.add("visible");
        toast("✓ Thank you! Your feedback has been received.");
      } catch (err) {
        toast(err.message || "Something went wrong.");
      } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span>Send Feedback to Artisans</span>`;
      }
    });
  }
});
