document.addEventListener("DOMContentLoaded", () => {
  const readmePath = document.body.getAttribute("data-readme-path");
  if (!readmePath) {
    console.error(
      "Please specify the README file path in the HTML body attribute",
    );
    return;
  }
  fetchAndDisplayMarkdown(readmePath);
});
function fetchAndDisplayMarkdown(url) {
  fetch(`https://api.github.com/repos/${url}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch README file. Status: ${response.status}`,
        );
      }
      return response.json();
    })
    .then((data) => {
      const markdownContent = atob(data.content);
      const parsedContent = marked.parse(markdownContent);
      const scaledContent = downscaleImages(parsedContent);
      document.getElementById("theme-content").innerHTML = scaledContent;
    })
    .catch((error) => {
      console.error(error);
    });
}
function downscaleImages(htmlContent) {
  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  const images = container.querySelectorAll("img");
  images.forEach((img) => {
    img.style.maxWidth = "70%";
  });
  return container.innerHTML;
}
