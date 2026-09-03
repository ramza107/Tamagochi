document.getElementById("year").textContent = String(new Date().getFullYear());

const topbar = document.querySelector(".topbar");
const onScroll = () => {
  topbar?.classList.toggle("is-solid", window.scrollY > 16);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

document.querySelectorAll(".lane, .statement blockquote, .pillars li, .talk-copy, .talk-form").forEach((el) => {
  el.classList.add("reveal");
});

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

const form = document.getElementById("talk-form");
const status = document.getElementById("form-status");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !phone || !message) {
    status.textContent = "Заповніть усі поля.";
    return;
  }

  status.textContent = "Дякуємо. Відповімо протягом робочого дня.";
  form.reset();
});
