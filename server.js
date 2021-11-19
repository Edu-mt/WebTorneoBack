var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const multer = require("multer");
// const upload = multer({ dest: './public/data/uploads/' })
var fs = require('fs');
var MongoClient = require("mongodb").MongoClient;
const { response } = require("express");
var url = "mongodb://localhost:27017/";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-COntrol-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.use(bodyParser.json());

app.use(express.static("public"));

app.post("/altaUsuario", function (req, res) {
  console.log("altaUsuario");

  var isFind = false;

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    var data = req.body;

    var resultBusqueda;
    dbo
      .collection("users")
      .find({ nombre: { $eq: data.nombre } })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        resultBusqueda = result;
        //comprobar que el array dl resultado de la busqueda es mayor que 0
        if (result.length > 0) {
          console.log("el usuario ya existe");
          isFind = true;
          res.end(JSON.stringify({ stateFind: isFind, data: data }));
        } else {
          //si no tiene ningun elemento el array de la busqeuda
          //significa que no existe en la base de datos e insertamos...
          console.log("el usuario no existe");
          MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("proyectfinal");
            dbo.collection("users").insertOne(data, function (err, res) {
              if (err) throw err;
              console.log("1 document inserted");
              db.close();
            });
          });
          res.end(JSON.stringify({ stateFind: isFind, data: data }));
        }
      });
  });
});

//Loggin
app.get("/getLoggin", function (req, res) {
  console.log(req.query);

  var isFindGet = false;

  const nombre = req.query.nombre;
  const password = req.query.password;
  console.log("este es el app.get", nombre, password);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    var data = req.query;
    dbo
      .collection("users")
      .find({
        $and: [
          { nombre: { $eq: data.nombre } },
          { password: { $eq: data.password } },
        ],
      })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log("este es el find del app.get", result);
        if (result.length > 0) {
          console.log("el usuario ya existe del get del server");
          isFindGet = true;
          res.end(JSON.stringify({ stateFindGet: isFindGet, data: result }));
        } else {
          console.log("no existe el usuario introducido");
          res.end(JSON.stringify({ stateFindGet: isFindGet, data: result }));
        }
        db.close();

        // res.json({ result });
      });
  });
});

// Creacion de equipos
app.post("/CrearEquipo", function (req, res) {
  // Prepare output in JSON format
  console.log("console CrearEquipo", req.body);
  data = {
    nombreEquipo: req.body.nombreEquipo,
    listaJugadores: req.body.listaJugadores,
    logo: req.body.logo,
    color1: req.body.color1,
    color2: req.body.color2,
  };
  console.log(data);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    dbo.collection("equipos").insertOne(data, function (err, res) {
      if (err) throw err;
      console.log("1 Equipo inserted");
      db.close();
    });
    res.end(JSON.stringify(data));
  });
});

// Enviar equipo al front
app.post("/traerEquipo", function (req, res) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    dbo
      .collection("equipos")
      .find()
      .toArray(function (err, result) {
        if (err) throw err;
        console.log("find del app.post traerEquipo", result);
        res.end(JSON.stringify(result));
      });
  });
});

// Unir usuario a un equipo
app.post("/unirseEquipo", function (req, res) {
  var isFindEquipo = false;

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    let data = req.body;
    
    let deletevalue = { $pull: { listaJugadores: data.nombreUsuario } };
    let myqueryJugador = { listaJugadores: data.nombreUsuario };

    let myquery = { nombreEquipo: data.nombreEquipo };
    let newvalues = { $push: { listaJugadores: data.nombreUsuario } };

    let myqueryUser = { nombre: data.nombreUsuario };
    let newvaluesUser = { $set: { nombreEquipo: data.nombreEquipo } };

    dbo
    .collection("equipos")
    .find(myqueryJugador)
    .toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      resultBusqueda = result;
      //comprobar que el array dl resultado de la busqueda es mayor que 0
      if (result.length > 0) {        
        isFindEquipo = true;
        res.end(JSON.stringify({ stateFindEquipo: isFindEquipo }));
      }else{
        dbo
        .collection("equipos")
        .updateOne(myquery, newvalues, function (err, result) {
          if (err) throw err;
          console.log("find del app.post unirseEquipo", result);
        });
  
      dbo
        .collection("users")
        .updateOne(myqueryUser, newvaluesUser, function (err, res) {
          if (err) throw err;
          console.log(res);
          db.close();
        });
      }
    });    
    if (data.cambiarEquipo === true){
      dbo
      .collection("equipos")
      .updateOne(myqueryJugador, deletevalue, function (err, result) {
        if (err) throw err;
        console.log("find del app.post unirseEquipo", result);
      });
      dbo
      .collection("equipos")
      .updateOne(myquery, newvalues, function (err, result) {
        if (err) throw err;
        console.log("find del app.post unirseEquipo", result);
      });

    dbo
      .collection("users")
      .updateOne(myqueryUser, newvaluesUser, function (err, res) {
        if (err) throw err;
        console.log(res);
        db.close();
      });
    }        
  
  });
});

// Creacion de coleccion para el generador de torneos
app.post("/GenerarTorneo", function (req, res) {
  console.log("console CrearEquipo", req.body);
  data = {
    nombreTorneo:  req.body.nombreTorneo,
    arrayPartidas: req.body.arrayPartidas,
    ganadores: [],
  };
  console.log(data);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    dbo.collection("Torneos").insertOne(data, function (err, res) {
      if (err) throw err;
      console.log("1 Torneo insertado");
      db.close();
    });
    res.end(JSON.stringify(data));
  });
});


app.get('/traerTorneo', function(req, res) {
  MongoClient.connect(url, function(err, db) { 
     if (err) throw err; 
     var dbo = db.db("proyectfinal"); 
     dbo.collection("Torneos").find({}).toArray(function(err, data) { 
       if (err) throw err; 
       console.log("---TRAER TORNEO DEL SERVIDOR---",data);
       res.end(JSON.stringify(data));
       db.close(); 
     }); 
   }); 
});

app.post("/enviarGanador", function (req, res) {
  var isFindEnviarGanador = false;
  console.log("console CrearEquipo", req.body);
  MongoClient.connect(url, function (err, db) {
    var dbo = db.db("proyectfinal");   
      let newGanadores = { $push: { "ganadores": req.body } };
      dbo
      .collection("Torneos")
      .find( { "ganadores.indice" : { $eq:req.body.indice } })
      .toArray(function (err, result) {
      if (err) throw err;
      console.log("este es el resultado" , result)
      if(result.length === 0){
        if (err) throw err;          
        console.log(req.body);
        var dbo = db.db("proyectfinal");
        dbo.collection("Torneos").updateOne({},newGanadores, function (err, res) {
        if (err) throw err;
        console.log("1 Torneo insertado");
        
        });
          
        dbo.collection("Torneos").find({},{ projection: { _id: 0, ganadores:1} }).toArray(function(err, resultGanadores) { 
          if (err) throw err; 
          console.log("Este es result ganadores", resultGanadores); 
          db.close()
          let ganadoresOrdenados = resultGanadores;

          function mycomparator(a,b) {
            return (a.indice) - (b.indice);
          }
          
          ganadoresOrdenados[0].ganadores.sort(mycomparator);
        console.log("Este esganadores con sort", ganadoresOrdenados[0].ganadores); 
        console.log("Este es ganadores resultGanadores[0].ganadores", resultGanadores[0].ganadores); 
        console.log("Este esganadores con ganadoresOrdenados[0].ganadores", ganadoresOrdenados[0].ganadores); 

        }); 

     
       
      }
      else{
        isFindEnviarGanador = true;
        res.end(JSON.stringify({ stateisFindEnviarGanador: isFindEnviarGanador }));
      }
    });
  });
});


app.post("/cambiarGanador", function (req, res) {
  console.log("console req.body", req.body);
  MongoClient.connect(url, function(err, db) { 
    if (err) throw err; 
    var dbo = db.db("proyectfinal"); 

    dbo.collection("Torneos").find( { "ganadores.indice" : { $eq:req.body.indice }}).toArray(function (err, result) {
      if (err) throw err;
      console.log("este es el resultado" , result)
      
        if(result.length > 0){
          let longitud = result[0].ganadores.length;
          console.log("este es el result0 antes" , result[0].ganadores);
          let ganadoresAntiguos = result[0].ganadores;
          console.log("ganadoreAntiguos antes antes del splice" , ganadoresAntiguos);
         
          ganadoresAntiguos.splice(req.body.indice-1,1);
          
         

          console.log("ganadoreAntiguos antes despues del splice" , ganadoresAntiguos);
          ganadoresAntiguos.push(req.body);
          let nuevosGanadores= ganadoresAntiguos;
          console.log("nuevosganadores despues del push" , nuevosGanadores);
         
            // primero encontrar la posicion en la que se encuentra este indice dentro del array de ganadores
            // una vez q la hemos encontrado(creo q nos  serviria indexOf), una vez tenemos la posicion 
            // hacemos el splice de la posicion en la q se encuentra el objeto q coincide con nuestro indice a modificar
          let nuevoResult= (req.body.resultados)
          let indice= nuevosGanadores.indexOf(req.body);
          console.log("Este es el indexposition",indice);
          nuevoCombo ={nuevoResult,indice}
          nuevosGanadores.splice(indice,1, nuevoCombo);
          console.log("EStes es el splice del indice",nuevosGanadores);
          var dbo = db.db("proyectfinal");
          let pullAntiguosGanadores= { $pull: {"ganadores": {$ne:0 }}};
          dbo.collection("Torneos").updateOne({nombreTorneo:"For honor"},pullAntiguosGanadores, function (err, res) {
            if (err) throw err;
            console.log("nuevos ganadores insertados");
          }); 
          let pushNuevosGanadores= { $push: {"ganadores":nuevosGanadores }};

          dbo.collection("Torneos").updateOne({nombreTorneo:"For honor"},pushNuevosGanadores, function (err, res) {
            if (err) throw err;
            console.log("nuevos ganadores insertados");
            db.close();
            });
          
      }
    }); 
  });
});







var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
});
