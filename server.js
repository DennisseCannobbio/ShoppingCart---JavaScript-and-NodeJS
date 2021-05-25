if(process.env.NODE_ENV !== 'production'){
    //Para que la key secreta del payment no se suba a github 
    require('dotenv').config({path:'.env'});
}

//Variable pública 
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
//Variable secreta  
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

console.log(stripeSecretKey, stripePublicKey)


const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('viewengine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

//Referenciamos items.json que son los items que creamos con ID para poder usar el Payment
app.get('/store', function(req, res){
    //Leemos los items que creamos en items.json
    fs.readFile('items.json', function(error, data){
        if(error){
            //Mostramos el estado
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                //Le enviamos stripePublicKey de nuestro servidor
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})



app.post('/purchase', function(req, res){
    //Leemos los items que creamos en items.json
    fs.readFile('items.json', function(error, data){
        if(error){
            //Mostramos el estado
            res.status(500).end()
        } else {
          //Tomamos los data JSON y los convertimos en objetos JSON
          const itemsJson = JSON.parse(data)
          const itemsArray = itemsJson.music.concat(itemsJson.merch)
          let total = 0
          //Aca accedemos a los items del body que están ubicados en el archivo JSON de app.js 
          //Hacemos un loop entre los items que encontremos
          req.body.items .forEach(function(item){
              const itemJson = itemsArray.find(function(i){
                  //Cuando el id del array sea igual al id del request body, tendremos acceso al precio del item que está en el JSON
                  return i.id == item.id 
              })
              total = total + itemJson.price * item.quantity 
          })
          //Creamos la transacción
          stripe.charges.create({
              amount: total,
              source: req.body.stripeTokenId,
              currency: 'usd'
          }).then(function(){
            console.log('Se ha hecho un cargo a su tarjeta')
            res.json({ message: '¡Su compra fue realizada con éxito!'})
            console.log("Se han comprado los items con éxito")
          }).catch(function(){
              console.log("Error, no se hizo un cargo a su tarjeta")
              res.status(500).end()
          })
        }
    })
})

app.listen(5000)