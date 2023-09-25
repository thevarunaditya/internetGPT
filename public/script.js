/* script.js */

const socket = io();

const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const loadingIndicator = document.createElement('div');

loadingIndicator.textContent = 'AI is typing...';
loadingIndicator.style.color = 'green';

let inputText = '';
let isWaitingForResponse = false;

document.addEventListener('keydown', (e) => {
  if (isWaitingForResponse || ["Meta", "Alt", "Control", "Shift"].includes(e.key)) {
    e.preventDefault();
    return;
  }

  if(e.key === 'Enter') {
    e.preventDefault();
    isWaitingForResponse = true;
    output.appendChild(document.createTextNode('Prompt: ' + inputText));
    socket.emit('sendInput', { input: inputText });
    inputText = '';
    output.appendChild(loadingIndicator);
  } else if(e.key === 'Backspace') {
    e.preventDefault();
    inputText = inputText.slice(0, -1);
  } else {
    inputText += e.key;
  }
  renderInput();
});

socket.on('scriptOutput', (data) => {
  isWaitingForResponse = false;
  output.removeChild(loadingIndicator);
  data = styleCodeSegments(data);
  output.appendChild(document.createElement('br'));
  output.appendChild(data);
});

socket.on('scriptError', (data) => {
  isWaitingForResponse = false;
  output.removeChild(loadingIndicator);
  data = styleCodeSegments(data);
  output.appendChild(document.createElement('br'));
  output.appendChild(data);
});

function renderInput() {
  inputLine.textContent = isWaitingForResponse ? '' : 'Enter your prompt: ' + inputText;
  inputLine.appendChild(document.createElement('div')).className = 'input-cursor';
}

function styleCodeSegments(data) {
  let container = document.createElement('div');
  let segments = data.split(/(\[.*?\]\(.*?\)|\[\^.*?\^](?:\(.*?\))?)/g);

  for (let i = 0; i < segments.length; i++) {
    let span = document.createElement('span');

    if (/^\[.*\]\(.*\)$/.test(segments[i])) {
      let match = segments[i].match(/^\[(.*)\]\((.*)\)$/);
      let anchor = document.createElement('a');
      anchor.textContent = match[1];
      anchor.href = match[2];
      anchor.target = "_blank"; // opens the link in a new tab
      anchor.className = 'link2';
      span.appendChild(anchor);
    } 
    else if (/^\[\^(.*)\^\](?:\((.*)\))?/.test(segments[i])) {
      let match = segments[i].match(/^\[\^(.*)\^\](?:\((.*)\))?/);
      let text = document.createElement('span');
      text.textContent = match[1];

      if (match[2]) {
        let anchor = document.createElement('a');
        anchor.href = match[2];
        anchor.className = 'blue-link';
        anchor.target = "_blank"; // opens the link in a new tab
        anchor.appendChild(text);
        span.appendChild(anchor);
      } 
      else {
        text.className = 'blue-text';
        text.style.verticalAlign = "super";
        span.appendChild(text);
      }
    } 
    else {
      if (i % 4 === 2) span.className = 'code';
      span.textContent = segments[i];
    }
    container.appendChild(span);
  }
  return container;
}
