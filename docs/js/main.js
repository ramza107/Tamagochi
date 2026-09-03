document.getElementById("year").textContent = String(new Date().getFullYear());

document.querySelectorAll(".service-rows article, .method-list p, .contact-grid > div, #form").forEach((el) => {
  el.classList.add("reveal");
});

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("show"));
}

const form = document.getElementById("form");
const status = document.getElementById("status");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  if (![...data.values()].every((v) => String(v).trim())) {
    status.textContent = "Заповніть усі поля.";
    return;
  }
  status.textContent = "Дякуємо. Відповімо протягом робочого дня.";
  form.reset();
});
