function loadPage(page) {
  fetch(page + ".html")
    .then((response) => {
      if (!response.ok) {
        fetch("/404.html");
      }
      return response.text();
    })
    .then((html) => {
      document.getElementById("content").innerHTML = html;
      history.pushState({ page }, null, page);
    })
    .catch((error) => {
      console.error(error);
    });
}

window.onpopstate = (event) => {
  if (event.state) {
    loadPage(event.state.page);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadPage("home");
});
