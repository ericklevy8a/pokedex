/**
 * Pokedex API inteface in JS
 */

const pokeApiUrl = 'https://pokeapi.co/api/v2/';

var giPageSize = 12;
var giPageNum = 0;

var giPokeCount = null;

const pageContainer = document.getElementById('pokedex-container');

/**
 * pokeFetchPage
 * @param {integer} pageNum     The number of page to fetch to calculate the offset
 * @param {integer} pageSize    The limit size of the page (also to calculate the offset)
 * @returns JSON data with the response of the poke API web fetching
 */
async function pokeFetchPage(pageNum = giPageNum, pageSize = giPageSize) {
    let limit = pageSize;
    let offset = pageNum * pageSize;
    const url = pokeApiUrl + `pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeFetchAll() {
    if (giPokeCount == undefined) {
        giPokeCount = await pokeGetPokemonCount();
    }
    const data = await pokeFetchPage(0, giPokeCount);
    return data;
}

async function pokeFetchPokemon(num = 1) {
    const url = pokeApiUrl + `pokemon/${num}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeFetchUrl(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeGetPokemonCount() {
    result = await pokeFetchPage(0, 1);
    return result.count || false;
}

// Fetch all the pokemons names and urls in the pokedex and generate simple cards
pokeFetchAll().then(data => {
    var elements = data.results;
    elements.forEach(element => {
        let card = document.createElement('article');
        card.classList.add('card-mini');
        card.dataset.name = element.name;
        card.dataset.url = element.url;
        pageContainer.appendChild(card);
        observer.observe(card);
    });
});

//
//  INTERSECTION OBSERVER
//

// Options for the observer
const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
}

// Callback function for the observer
var intersectionCallback = function (entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let target = entry.target;
            fetchCard(target);
        }
    });
}

// Fetch content for the target card
async function fetchCard(target) {
    // Fetch one time only to optimize (when data is undefined)
    if (target.data == undefined) {
        // Fetch the pokemon data
        pokeFetchUrl(target.dataset.url).then(data => {
            target.data = data;
            target.innerHTML = '';
            let searchKeys = [];
            let id = data.id;
            searchKeys.push(id);
            searchKeys.push(data.name);
            let imageUrl = data.sprites.front_default || './img/null.png';
            let name = prepareTitle(data.name, '-');
            // Type dependent colors
            let head = document.createElement('div');
            head.classList.add('head');
            [...data.types].forEach(type => {
                let name = type.type.name;
                searchKeys.push(name);
                let title = prepareTitle(name, '-');
                // let color = typesColors[name];
                head.innerHTML += `<img class="type-icon ${name}" src="./img/type/${name}.svg" title="${title}">`;
            });
            head.innerHTML += `<span class="expanded right">${id}</span>`;
            target.appendChild(head);
            target.innerHTML += `<img src="${imageUrl}" onerror="this.style.display='none'"/>`;
            target.innerHTML += `<label title="${name}">${name}</label>`;
            // some data tags for search keys
            target.dataset.searchKeys = searchKeys.join(' ');
            // Set a click event listener
            target.addEventListener('click', pokeCardOnClick);
        });
    }
    return target;
}

// Create a instance of IntersectionObserver
var observer = new IntersectionObserver(intersectionCallback, options);

// Handler for card click event
function pokeCardOnClick(event) {
    let data = event.currentTarget.data;
    cardboxOpen(data);
}

//
// CODE FOR MODAL DIALOGS
//

/**
 * Modal message box dialog.
 *
 * Displays a message in a modal dialog box, waits for the user to click a button,
 * and send the button click event to the function especified to process the user choice.
 *
 * NOTE: The msgboxClose function need to be called to close the dialog box.
 *
 * Parameters:
 * @param {string} titleText    Required. String expression to display as a header.
 * @param {string} msgText      Required. String expression with the main meesage.
 * @param {array} arrActions    Optional. String or array of strings with the label
 *                              of the buttons to display. If omited, only an Ok button
 *                              will be displayed.
 * @param {function} titleText  A lambda function to process the buttons click event.
 *                              If omitted, the msgboxClose function will be called.
 */
function msgbox(title, text, arrActions = strings.btnOk || 'Ok', fnOnClick = msgboxClose) {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    const msgboxTitleClose = document.getElementById('msgbox-title-close');
    const msgboxTitle = document.getElementById('msgbox-title');
    const msgboxText = document.getElementById('msgbox-text');
    const msgboxButtons = document.getElementById('msgbox-buttons');
    // Close dialog handlers
    msgboxTitleClose.addEventListener('click', msgboxClose);
    document.addEventListener('keyup', document.keyupfn = function (e) { if (e.code == 'Escape') msgboxClose() });
    // Displat texts in title and message
    msgboxTitle.textContent = title;
    msgboxText.innerHTML = text;
    // Force the parameter for button(s) to an array
    if (!Array.isArray(arrActions)) {
        arrActions = [arrActions];
    }
    // Empty the button(s) container tag and...
    msgboxButtons.innerHTML = '';
    // ...fill it again with all the new buttons
    arrActions.forEach(element => {
        let button = document.createElement('button');
        button.innerText = element;
        button.addEventListener('click', fnOnClick);
        msgboxButtons.appendChild(button);
    });
    // Unhide modal screen and box
    modalScreen.style.display = 'block';
    msgbox.style.display = 'block';
    modalScreen.classList.add('show');
    msgbox.classList.add('show');
}

function msgboxClose() {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    document.removeEventListener('keyup', document.keyupfn);
    // Hide modal screen and box
    msgbox.classList.remove('show');
    modalScreen.classList.remove('show');
    setTimeout(() => {
        modalScreen.style.display = 'none';
        msgbox.style.display = 'none';
    }, 500);
}

/**
 * Modal configuration box dialog.
 *
 * Displays a configuration modal dialog box, call the update and display options functions,
 * and let the user change settings.
 */
function cardboxOpen(data) {
    const modalScreen = document.getElementById('modal-screen');
    const cardbox = document.getElementById('cardbox');
    const cardboxTitleClose = document.getElementById('cardbox-title-close');
    cardbox.data = data;
    // Close dialog handlers
    cardboxTitleClose.addEventListener('click', cardboxClose);
    document.addEventListener('keyup', document.keyupfn = function (e) { if (e.code == 'Escape') cardboxClose() });
    // Update and display options
    cardboxDisplayData(data);
    // Unhide modal screen and box
    modalScreen.style.display = 'block';
    cardbox.style.display = 'block';
    modalScreen.classList.add('show');
    cardbox.classList.add('show');
}

function cardboxDisplayData(data) {
    const cardboxContainer = document.getElementById('cardbox-content');
    cardboxContainer.data = data;
    // Id and Name
    const cardboxTitle = document.getElementById('cardbox-title');
    cardboxTitle.innerText = data.id + ' ' + prepareTitle(data.name, '-');
    // Sprites
    cardboxUpdateSprites();
    // Stats
    cardboxUpdateStats();
    // Size
    const sizeWeight = document.getElementById('size-weight');
    const sizeHeight = document.getElementById('size-height');
    sizeWeight.innerHTML = '<b>' + data.weight / 10 + ' kg</b>';
    sizeHeight.innerHTML = '<b>' + data.height / 10 + ' m</b>';
    // Types and damage relations
    cardboxUpdateTypes();
    // Abilities
    // Etc
}

function cardboxUpdateSprites() {
    const cardboxContainer = document.getElementById('cardbox-content');
    let sprites = cardboxContainer.data.sprites;
    const imageSprite = document.getElementById('image-sprite');
    const checkBack = document.getElementById('check-back');
    const checkShiny = document.getElementById('check-shiny');
    const checkFemale = document.getElementById('check-female');
    // Verify back sprites
    if (sprites['back_default'] == null) {
        checkBack.checked = false;
        checkBack.disabled = true;
    } else {
        checkBack.disabled = false;
    }
    // Verify shiny sprites
    if (sprites['front_shiny'] == null) {
        checkShiny.checked = false;
        checkShiny.disabled = true;
    } else {
        checkShiny.disabled = false;
    }
    // Verify female sprites
    if (sprites['front_female'] == null) {
        checkFemale.checked = false;
        checkFemale.disabled = true;
    } else {
        checkFemale.disabled = false;
    }
    // Select image
    let selKey = 'front_default';
    selKey = checkBack.checked ? 'back' : 'front';
    selKey += checkShiny.checked ? '_shiny' : '';
    selKey += checkFemale.checked ? '_female' : (checkShiny.checked ? '' : '_default');
    let url = sprites[selKey];
    if (url && typeof (url) === 'string') {
        imageSprite.title = selKey;
        imageSprite.src = sprites[selKey];
    }
    // Event listeners
    checkBack.addEventListener('change', cardboxUpdateSprites);
    checkFemale.addEventListener('change', cardboxUpdateSprites);
    checkShiny.addEventListener('change', cardboxUpdateSprites);
}

const typesColors = {
    bug: '#83C300',
    dark: '#5B5466',
    dragon: '#006FC9',
    electric: '#FBD100',
    fairy: '#FB89EB',
    fighting: '#E0306A',
    fire: '#FF9741',
    flying: '#89AAE3',
    ghost: '#4C6AB2',
    grass: '#38BF4B',
    ground: '#E87236',
    ice: '#4CD1C0',
    normal: '#919AA2',
    poison: '#B567CE',
    psychic: '#FF6675',
    rock: '#C8B686',
    steel: '#5A8EA2',
    water: '#3692DC',
};

function cardboxUpdateTypes() {
    const cardboxContainer = document.getElementById('cardbox-content');
    const typesTabsContainer = document.getElementById('types-tabs-container');
    const typesTabsHeader = document.getElementById('types-tabs-header');
    const typesTabs = document.getElementById('types-tabs');
    let types = [...cardboxContainer.data.types];
    typesTabsHeader.innerHTML = '';
    typesTabs.innerHTML = '';
    types.forEach(slot => {
        // Tab header
        let name = slot.type.name;
        let title = prepareTitle(name);
        let color = typesColors[name];
        let header = document.createElement('div');
        header.classList.add('type-slot');
        header.style.backgroundColor = color;
        header.innerHTML = `<img class="type-icon" src="./img/type/${name}.svg"/>`;
        header.innerHTML += `<span class="type-title">${title}</span>`;
        typesTabsHeader.appendChild(header);
        // Tab body
        let body = document.createElement('div');
        body.classList.add('tabify-tab');
        body.dataset.url = slot.type.url;
        body.style.borderColor = color;
        typesTabs.appendChild(body);
    });
    tabify(typesTabsContainer);
}

function cardboxUpdateStats() {
    const cardboxContainer = document.getElementById('cardbox-content');
    const statsContainer = document.getElementById('stats-container');
    let stats = [...cardboxContainer.data.stats];
    statsContainer.innerHTML = '';
    let html = '';
    html += '<table class="table-stats">';
    html += '<tbody>';
    for (let i = 0; i < 3; i++) {
        let stat = stats[i];
        html += '<tr>';
        let title = prepareTitle(stat.stat.name);
        html += `<td>${title}</td>`;
        let value = stat.base_stat;
        html += `<td><div class="stat-bar"><div class="stat-bar-inner ${stat.stat.name}" style="width: calc(${value} / 250 * 100%)"></div></div></td>`;
        html += `<td>${value}</td>`;
        html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    statsContainer.innerHTML = html;
}

function cardboxClose() {
    const modalScreen = document.getElementById('modal-screen');
    const cardbox = document.getElementById('cardbox');
    document.removeEventListener('keyup', document.keyupfn);
    // Hide modal screen and box
    modalScreen.classList.remove('show');
    cardbox.classList.remove('show');
    setTimeout(() => {
        modalScreen.style.display = 'none';
        cardbox.style.display = 'none';
    }, 500);
}

function tabLoadContent(element) {
    if (element.innerHTML == '') {
        // element.innerHTML = element.dataset.url;
        let data = pokeFetchUrl(element.dataset.url).then(data => {
            element.innerHTML = '';
            let arrayTo = [];
            let arrayFrom = [];
            let html = '';
            html += '<table class="table-damage">';
            html += '<tbody>';
            // headers
            html += '<tr>';
            html += '<th>Damage</th><th>To</th><th>From</th>';
            html += '</tr>';
            // Double
            html += '<tr>';
            html += '<td>Double</td>';
            arrayTo = data.damage_relations.double_damage_to;
            html += '<td>';
            arrayTo.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            arrayFrom = data.damage_relations.double_damage_from;
            html += '<td>';
            arrayFrom.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            html += '</tr>';
            // Half
            html += '<tr>';
            html += '<td>Half</td>';
            arrayTo = data.damage_relations.half_damage_to;
            html += '<td>';
            arrayTo.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            arrayFrom = data.damage_relations.half_damage_from;
            html += '<td>';
            arrayFrom.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            html += '</tr>';
            // Ineffective
            html += '<tr>';
            html += '<td>No</td>';
            arrayTo = data.damage_relations.no_damage_to;
            html += '<td>';
            arrayTo.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            arrayFrom = data.damage_relations.no_damage_from;
            html += '<td>';
            arrayFrom.forEach(item => {
                let title = prepareTitle(item.name);
                html += `<img src="./img/type/${item.name}.svg" title="${title}">`;
            });
            html += '</td>';
            html += '</tr>';
            html += '</tbody>';
            html += '</table>';
            element.innerHTML = html;
        });
    }
}

//
// TABIFY TABS IMPLEMENTATION
//

function tabify(element) {
    const header = element.querySelector('.tabify-tabs-header');
    const content = element.querySelector('.tabify-tabs');
    const tab_headers = [...header.children];
    const tab_contents = [...content.children];
    tab_contents.forEach(x => x.style.display = 'none');
    let current_tab_index = -1;

    function setTab(index) {
        if (current_tab_index > -1) {
            tab_headers[current_tab_index].classList.remove('current');
            tab_contents[current_tab_index].style.display = 'none';
        }
        if (current_tab_index !== index) {
            tabLoadContent(tab_contents[index]);
            tab_headers[index].classList.add('current');
            tab_contents[index].style.display = 'flex';
            current_tab_index = index;
        } else {
            current_tab_index = -1;
        }
    }

    default_tab_index = tab_headers.findIndex(x => {
        return [...x.classList].indexOf('tabify-default') > -1;
    });
    //default_tab_index = default_tab_index === -1 ? 0 : default_tab_index;
    setTab(default_tab_index);
    tab_headers.forEach((x, i) => x.onclick = event => setTab(i));
}

// this is where the magic happens!
//   [...document.querySelectorAll('.tabify-tabs-container')]
//     .forEach(x => tabify(x));

//
// SOME UTIL FUNCTIONS
//

function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1);
}

function prepareTitle(str, splitChar = ' ', joinChar = ' ') {
    let tokens = str.split(splitChar);
    str = '';
    tokens.forEach((token, index, array) => {
        array[index] = capitalize(token);
    });
    return tokens.join(joinChar);
}

// Top-nav menu initialization
function toggleMenu() {
    const menu = document.getElementById('top-menu');
    const icon = document.getElementById('toggle-icon');
    menu.classList.toggle('active');
    icon.innerText = (icon.innerText == 'menu') ? 'close' : 'menu';
}
document.getElementById('toggle-icon').addEventListener('click', toggleMenu);

// Search implementation
async function search() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    let value = searchInput.value.toLowerCase();
    // Disable search controls
    searchInput.disabled = true;
    searchButton.disabled = true;
    // TODO: Split search tokens and make a search criteria array
    // Iterates all the pokedex mini-cards to hide/unhide
    const cards = [...document.getElementsByClassName('card-mini')];
    cards.forEach(async function (card) {
        if (value == '') {
            card.style.display = 'flex';
            return;
        } else {
            fetchCard(card).then(async function (newCard) {
                let sk = await newCard.dataset.searchKeys;
                let flag = false;
                if (sk !== undefined && sk.includes(value)) {
                    flag = true;
                }
                newCard.style.display = flag ? 'flex' : 'none';
            });
        }
    });
    // Enable search controls
    searchButton.disabled = false;
    searchInput.disabled = false;
    searchInput.focus();
}
function onkeyup(e) {
    if (e.code == 'Escape') {
        e.target.blur();
        return;
    }
    if (e.code == 'Enter' || e.code == 'NumpadEnter') {
        search();
    }
}
document.getElementById('search-input').addEventListener('keyup', onkeyup);
document.getElementById('search-button').addEventListener('click', search);

// End of code.