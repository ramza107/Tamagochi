document.getElementById("year").textContent = String(new Date().getFullYear());

const header = document.querySelector(".site-header");
const onScroll = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add("is-visible"));
}

const form = document.getElementById("consult-form");
const note = document.getElementById("form-note");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !phone || !message) {
    note.textContent = "Заповніть усі поля, будь ласка.";
    return;
  }

  note.textContent = "Дякуємо. Запит прийнято — звʼяжемося протягом робочого дня.";
  form.reset();
});
