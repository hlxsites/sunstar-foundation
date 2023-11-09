export default function decorate(block) {
  const buttonContainers = block.querySelectorAll('.button-container');
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('button-wrapper');
  buttonContainers.forEach((buttonContainer) => {
    buttonWrapper.appendChild(buttonContainer);
  });
  block.appendChild(buttonWrapper);
}
