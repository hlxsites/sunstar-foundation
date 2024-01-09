import { readBlockConfig } from '../../scripts/lib-franklin.js';

function buildMutipleTables(block) {
  const mainContent = block.parentNode.parentNode;
  if (mainContent.querySelectorAll(':scope > .flat-table').length < 2) return;
  const mainChildren = [...mainContent.children];
  const mainTmp = document.createElement('div');
  for (let i = 0; i < mainChildren.length; i += 1) {
    if ((mainChildren[i].classList.contains('flat-table') && i === 0)
      || (mainChildren[i].classList.contains('flat-table') && !mainChildren[i - 1].classList.contains('flat-table'))) {
      const multiTable = document.createElement('div');
      multiTable.classList.add('multiple-table');
      for (let j = i; j < mainChildren.length; j += 1) {
        const currentIsFlatTable = mainChildren[j].classList.contains('flat-table');
        if (currentIsFlatTable && j === mainChildren.length - 1) {
          multiTable.append(mainChildren[j]);
          break;
        }
        const nextIsFlatTable = mainChildren[j + 1].classList.contains('flat-table');
        if (currentIsFlatTable && nextIsFlatTable) {
          multiTable.append(mainChildren[j]);
        }
        if (currentIsFlatTable && !nextIsFlatTable) {
          multiTable.append(mainChildren[j]);
          i = j;
          break;
        }
      }
      mainTmp.append(multiTable);
    } else {
      mainTmp.append(mainChildren[i]);
    }
  }
  mainContent.replaceChildren(...mainTmp.childNodes);
}

export default async function decorate(block) {
  const blockConfig = readBlockConfig(block);
  const missingCfgs = [blockConfig.title, blockConfig.annotation].filter((x) => !x).length;
  const tableDiv = document.createElement('div');
  tableDiv.classList.add('table-item');
  const tableAnnotation = document.createElement('p');
  tableAnnotation.classList.add('table-annotation');
  const tableTitle = document.createElement('h3');
  tableTitle.classList.add('table-title');

  if (blockConfig.title) {
    tableTitle.innerHTML = blockConfig.title;
  }

  if (blockConfig.annotation) {
    tableAnnotation.innerHTML = blockConfig.annotation;
  }

  const tableChild = [...block.children].filter((x) => x.innerText.trim().toLowerCase().startsWith('table'))[0];
  if (tableDiv.getAttribute('style') === null) {
    const rowLength = ([...block.children].length - 2 + missingCfgs).toString();
    const colLength = (tableChild.children.length - 1).toString();
    tableDiv.setAttribute('style', `--row:${rowLength};--col:${colLength}`);
  }

  [...tableChild.children].forEach((childDiv, x) => {
    if (x) {
      childDiv.classList.add('table-head');
      tableDiv.append(childDiv);
    }
  });

  if (!blockConfig.title) {
    block.replaceChildren(tableDiv);
  } else {
    block.replaceChildren(tableTitle);
    block.append(tableDiv);
  }

  if (blockConfig.annotation) block.append(tableAnnotation);
  if (block.classList.contains('flat')) block.parentElement.classList.add('flat-table');
  buildMutipleTables(block);
}
