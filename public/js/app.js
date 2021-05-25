if(document.readyState == 'loading'){
    document.addEventListener('DOMContentLoaded', ready)
} else{
    ready()
}

function ready(){
    /*Remover items del carrito de compra*/

    //Esta variable remueve items del carrito de compras
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    console.log(removeCartItemButtons)
    //Loop dentro de todos los btn-danger que existen
    for( var i = 0; i < removeCartItemButtons.length; i++){
        //Boton igual a cualsea de los items que estamos en loop
        var button = removeCartItemButtons[i]
        //Cuando hagamos click se va a eliminar el item del carrito de compras
        button.addEventListener('click', removeCartItem)
    }

    //Para no colocar un valor menor a 0 en la cantidad de items del carrito
    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    //Loop dentro de todos los quantityInputs que existen en el código
    for (var i = 0; i < quantityInputs.length; i++){
        //Input igual a cualsea de los items que están en loop
        var input = quantityInputs[i]
        //Cuando se cambie la cantidad de items del carrito va a cambiarse en la interfaz también
        input.addEventListener('change', quantityChanged)
    }

    //Cuando apretemos el botón de agregar al carrito se agregue al carrito
    var addCartButtons = document.getElementsByClassName('shop-item-button')
    //Loop dentro de todos los shop-item-buton que existen en el código
    for (var i = 0; i < addCartButtons.length; i++){
        //Botón igual a cualsea de los items que están en el loop
        var button = addCartButtons[i]
        //Cuando se haga click en el botón, el item se agregará al carrito 
        button.addEventListener('click', addToCartClicked)

    }

    //Quitamos todos los productos del carrito cuando seleccionemos "comprar"
    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchasedClicked)
}

//Variable que maneja nuestras interacciones con Stripe
var stripeHandler = StripeCheckout.configure({
    //Nuestra llave que enviamos desde el server al frontend 
    key: stripePublicKey,
    //Lenguaje automático
    locale: 'auto',
    //Función para ver que ponemos cuando Stripe nos envía info del back
    //Esta función se llama justo después de que la persona seleccione "Comprar"
    token: function(token){
       //Necesitamos obtener los items que compramos y la cantidad también
       var items = []
       var cartItemContainer = document.getElementsByClassName('cart-items')[0]
       var cartRows = cartItemContainer.getElementsByClassName('cart-row')
       //Loop entre todos los cart-row
       for(var i = 0; i < cartRows.length; i++){
           var cartRow = cartRows[i]
           var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
           var quantity = quantityElement.value
           var id = cartRow.dataset.itemId
           //Tenemos en el carrito nuestros items con el id y la cantidad
           items.push({
               id: id,
               quantity: quantity
           })
       }

       //Enviamos información a nuestro server.js
       fetch('/purchase', {
           //POST cuando quieren enviar info al server.js
           method: 'POST',
           headers: {
               //Enviamos json y recibimos json del server 
               'Content-Type': 'application/json',
               'Accept': 'application/json'
           },
           //Body es todo lo que le queremos enviar al server
           body: JSON.stringify({
                //Colocamos toda la info que queremos enviar al server
                stripeTokenId: token.id,
                items: items
           })
       }).then(function(res){
           return res.json()
       }).then(function(data){
           alert(data.message)
            //Eliminamos todos los items que tenemos en el carrito
            var cartItems = document.getElementsByClassName('cart-items')[0]
            //Loop entre todos los item children dentro de cart-items
            while(cartItems.hasChildNodes()){
                cartItems.removeChild(cartItems.firstChild)
            }
    updateCartTotal() 
       }).catch(function(error){
           console.log(error)
       })
    }
})

//Función purchasedClicked
function purchasedClicked(){
    //Necesitamos el precio por eso usamos este var
    var priceElement = document.getElementsByClassName('cart-total-price')[0]
    var price = parseFloat(priceElement.innerHTML.replace('$', '')) * 100
    stripeHandler.open({
        amount: price
    })
}

//Función de cantidad de item
function quantityChanged(event){
    var input = event.target
    //Si el input de la cantidad de item es un número y si no es menor a 0
    if(isNaN(input.value) || input.value <= 0){
        input.value = 1 
    }
    updateCartTotal()
}

//Función clickear par agregar al carrito
function addToCartClicked(event){
    var button = event.target
    //Seleccionamos el precio y el item con parentElement
    var shopItem = button.parentElement.parentElement
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    var id = shopItem.dataset.itemId
    //Con este metodo añadimos los items al carrito, seleccionamos el titulo, el precio y la imagen
    addItemToCart(title, price, imageSrc, id)
    updateCartTotal()
}

//Función para agregar los items al carrito
function addItemToCart(title, price, imageSrc, id){
    //Creamos un row para nuestro item del carrito, este se crea en el momento en que añadimos cosas al carrito
    var cartRow = document.createElement('div')
    //Agregamos la clase "cartrow" a nuestro elemento que creamos en la linea anterior
    cartRow.classList.add('cart-row')
    //Agregamos el id de los productos al carrito de compras
    cartRow.dataset.itemId = id
    var cartItems = document.getElementsByClassName('cart-items')[0]
    //Verificamos si el mismo producto se agrego para aumentarlo en cantidad y no volver a agregarlo "graficamente"
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    //Hacemos un loop dentro de todos los cart-item-title
    for(var i = 0; i < cartItemNames.length; i++){
        //
        if(cartItemNames[i].innerText == title) {
            alert('Este producto ya ha sido agregado')
            return 
        }
    }
    //Para que utilize el formato bonito de la página (para que se vea mejor)
    var cartRowContents = `
            <div class="cart-item cart-column">
                <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
                <span class="cart-item-title">${title}</span>
            </div>
                <span class="cart-price cart-column">${price}</span>
            <div class="cart-quantity cart-column">
                 <input class="cart-quantity-input" type="number" value="1">
                <button class="btn btn-danger" type="button">QUITAR</button>
            </div>`
            //Con este comando le agregamos el código anterior a la nueva columna de los items
            cartRow.innerHTML = cartRowContents
    //Con esto agregamos el nuevo div al código appendChild
    cartItems.appendChild(cartRow)
    //Actualizamos el precio cada vez que cambiamos la cantidad o añadimos un producto al carrito
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}


//Función para remover un item del carrito
function removeCartItem(event){
    var buttonClicked = event.target
    //Seleccionamos el parentElement ya que necesitamos acceder al item que necesitamos quitar del carrito, en este caso corresponde a cart-row
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

//Función actualizar precio carrito
function updateCartTotal(){
    //Selecciona todas las columnas que contengan cart-items con un array
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    //Loop dentro de todos los cart-row que existen
    for( var i = 0; i < cartRows.length;  i++){
        //cartRow igual a cualsea de los items que estamos en loop
        var cartRow = cartRows[i]
        //Seleccionamos el precio del producto
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        //Seleccionamos la cantidad
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        console.log(priceElement, quantityElement)
        //Necesitamos la información dentro de los elementos sacados (priceElement y quantityElement)
        //innerText sirve para obtener cualquier texto que este dentro de ese elemento, en este caso priceElement
        //Replace sirve para reemplazar valores dentro del innerText, en este caso lo reemplazamos por un caracter vacío
        //parseFloat nos sirve para retornar numeros decimales y no strings 
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        //.value para obtener el valor en sí del elemento, en este caso la cantidad del item
        var quantity = quantityElement.value
        total = total + (price * quantity)
    } 
    // Para que los números queden con 2 decimales
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText  = '$' + total
}
