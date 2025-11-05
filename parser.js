// @todo: напишите здесь код парсера'
/**
 * Функция для получения метаданных страницы
 */
function getMeta() {
    const html = document.querySelector('html');
    const head = document.querySelector('head');

    const language = html.getAttribute('lang').trim();
    const title = head.textContent.split('—')[0].trim();
    const keywords = head.querySelector('meta[name="keywords"]').getAttribute('content').split(',').map(item => item.trim());
    const description = head.querySelector('meta[name="description"]').getAttribute('content');
    const opengraph = {};

    //заполняем opengraph
    Array.from(head.querySelectorAll('meta[property^="og:"]')).forEach(meta => {
        const prop = meta.getAttribute('property').slice(3);
        //проверяем, если prop равняется title, то нужно обрезать контент до символа "—" - это нестандартное тире
        opengraph[prop] = prop == 'title' ? meta.getAttribute('content').split('—')[0].trim() : meta.getAttribute('content').trim();
    });

    return {
        title,
        description,
        keywords,
        language,
        opengraph
    }
}

/**
 * Функция для получения данных карточки товара, который представлен на странице
 */
function getProduct() {
    const productSection = document.querySelector('section.product');
    const id = productSection.dataset.id;
    const isLiked = productSection.querySelector('button.like').classList.contains('active');
    const name = productSection.querySelector('h1').textContent;
    const price = +productSection.querySelector('.about .price').textContent.split('₽')[1].trim();

    //получение валюты
    let currency = '';
    const currencySymbol = productSection.querySelector('.about .price').textContent.trim().split('')[0];
    if (currencySymbol === '₽') {
        currency = 'RUB';
    } else if (currencySymbol === '$') {
        currency = 'USD';
    } else if (currencySymbol === '€') {
        currency = 'EUR';
    }
    
    //свойства товара
    const propElems = productSection.querySelectorAll('.properties li');
    let properties = {};
    for (const el of propElems) {
        properties[el.textContent.trim().split('\n')[0]] = el.textContent.trim().split('\n')[1].trim();
    }
    
    let oldPrice = null;
    let discount = 0;
    let discountPercent = '0%';
    //расчитыввание скидк и процента скидки, если скидка есть
    if (productSection.querySelector('.about .price span').textContent){
        oldPrice = +productSection.querySelector('.about .price').textContent.split('₽')[2].trim();
        discount = +oldPrice - +price;
        discountPercent = `${((oldPrice - price) * 100 / oldPrice).toFixed(2)}%`;
    }
    
    const images = [];
    //получаем ссылку на главное фото, которое появляется при загрузке страницы
    const mainImage = productSection.querySelector('.preview figure img');
    //получаем псевдомассив дополнительных фотографий товара, включая главное фото
    const imagesAdditional = productSection.querySelectorAll('.preview nav button img');
    //проходимся по псевдомассиву, добавляя дополнительные фото
    for (let i = 0; i < imagesAdditional.length; i++) {
        //если совпал src у главного фото и дополнительного, то его ставим на первое место
        if (mainImage.src == imagesAdditional[i].dataset.src) {
            images[0] = {
                preview: imagesAdditional[i].src,
                full: imagesAdditional[i].dataset.src,
                alt: imagesAdditional[i].alt,
            }
        } else {
            images[i] = {
                preview: imagesAdditional[i].src,
                full: imagesAdditional[i].dataset.src,
                alt: imagesAdditional[i].alt,
            }
        }
    }
    //получаем теги, если они есть
    const tagsElems = productSection.querySelectorAll('.about .tags span');
    const tags = {
        category: [],
        discount: [],
        label: []
    }
    if (tagsElems) {
        for (let el of tagsElems) {
            if (el.className === 'green') {
                tags.category.push(el.textContent.trim());
            } else if (el.className === 'blue') {
                tags.label.push(el.textContent.trim());
            } else if (el.className === 'red') {
                tags.discount.push(el.textContent.trim());
            }
        }
    }

    //описание товара
    const descriptionElem = productSection.querySelector('.description');
    let description = descriptionElem.innerHTML.trim();
    const descriptionElemChilds = descriptionElem.children;
    for (let child of descriptionElemChilds) {
        const childAttributes = child.attributes;
        if (childAttributes.length > 0) {
            for (let i = 0; i < childAttributes.length; i++) {
                let attribute = childAttributes[i];
                let attributeStr1 = attribute.name + '="' + attribute.value + '"';
                let attributeStr2 = attribute.name + "='" + attribute.value + "'";
                description = description.replace(' ' + attributeStr1, '');
                description = description.replace(' ' + attributeStr2, '');
            }
        }
    }

    return {
        id,
        name,
        isLiked,
        tags,
        price,
        oldPrice,
        discount,
        discountPercent,
        currency,
        properties,
        description,
        images
    }
}

/**
 * Функция для получения массива дополнительных товаров
 */
function getSuggested() {
    let suggested = [];
    //получаем список карточек
    const suggestedProducts = document.querySelectorAll('.suggested .container .items article');
    for (const article of suggestedProducts) {
        const product = {};
        product['name'] = article.querySelector('h3').textContent;
        product['description'] = article.querySelector('p').textContent;
        product['image'] = article.querySelector('img').src;
        product['price'] = article.querySelector('b').textContent.slice(1);
        let currency = '';
        const currencySymbol = article.querySelector('b').textContent.slice(0, 1);
        if (currencySymbol === '₽') {
            currency = 'RUB';
        } else if (currencySymbol === '$') {
            currency = 'USD';
        } else if (currencySymbol === '€') {
            currency = 'EUR';
        }
        product['currency'] = currency;
        suggested.push(product);
    }
    return suggested;
}

/**
 * Функция для получения массива обзоров
 */
function getReviews() {
    let reviews = [];
    const reviewsElems = document.querySelectorAll('.reviews .container .items article');
    for (const el of reviewsElems) {
        const review ={};
        review['rating'] = el.querySelectorAll('.rating .filled').length;
        review['author'] = {
            avatar: el.querySelector('.author img').src,
            name: el.querySelector('.author span').textContent
        };
        review['title'] = el.querySelector('div .title').textContent;
        review['description'] = el.querySelector('div p').textContent;
        review['date'] = el.querySelector('.author i').textContent.replaceAll('/', '.');
        reviews.push(review);
    }
    return reviews;
}

function parsePage() {
    return {
        meta: getMeta(),
        product: getProduct(),
        suggested: getSuggested(),
        reviews: getReviews()
    };
}

window.parsePage = parsePage;