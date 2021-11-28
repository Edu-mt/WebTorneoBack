var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const multer = require("multer");

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

        if (result.length > 0) {
          console.log("el usuario ya existe");
          isFind = true;
          res.end(JSON.stringify({ stateFind: isFind, data: data }));
        } else {

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
        console.log("este es el find del app.getLoggin", result);
        if (result.length > 0) {
          console.log("el usuario ya existe del get del server");
          isFindGet = true;
          res.end(JSON.stringify({ stateFindGet: isFindGet, data: result }));
        } else {
          console.log("no existe el usuario introducido");
          res.end(JSON.stringify({ stateFindGet: isFindGet, data: result }));
        }
        db.close();      
      });
  });
});

app.post("/CrearEquipo", function (req, res) {
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

app.post("/GenerarTorneo", function (req, res) {
  console.log("console GenerarTorneo", req.body);
  data = {
    nombreTorneo:  req.body.nombreTorneo,
    arrayPartidas: req.body.arrayPartidas,
    ganadores: [],
    jornadas: [],
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

app.post("/enviarGanador", async function (req, res) {
  var isFindEnviarGanador = false;
  console.log("EMPIEZA POR AQUI EL GANADOR req.body", req.body);
  MongoClient.connect(url, function (err, db) {
    var dbo = db.db("proyectfinal");   
      let newGanadores = { $push: { "ganadores": req.body } };
      dbo
      .collection("Torneos")
      .find( { "ganadores.indice" : { $eq:req.body.indice } })
      .toArray(function (err, result) {
      if (err) throw err;
      console.log("SEGUNDO HACE LA BUSQUEDA POR INDICE, result" , result);
      if(result.length === 0){
        if (err) throw err;          
        var dbo = db.db("proyectfinal");
        dbo.collection("Torneos").updateOne({},newGanadores, function (err, res) {
        if (err) throw err;
        console.log("TERCERO INSERTA EL GANADOR, res", res);        
        });
          
        dbo.collection("Torneos").find({},{ projection: { _id: 0, ganadores:1} }).toArray(function(err, resultGanadores) { 
          if (err) throw err; 
          console.log("CUARTO, HACE UNA BUSQUEDA DE LOS GANADORES,  resultGanadores", resultGanadores);           

         function  mycomparator(a,b) {
            return (a.indice) - (b.indice);
          }
          resultadoGanadores =  resultGanadores[0].ganadores.sort(mycomparator);
          console.log("QUINTO, NOS TRAE EL RESULTADO ORDENADO, resultadoGanadores ", resultadoGanadores); 

          dbo.collection("Torneos").updateOne({"ganadores.indice" : { $eq:req.body.indice } },{ $set: { "ganadores": resultadoGanadores } }, function (err, res) {
            if (err) throw err;
            console.log("SEXTO, ACTUALIZACION DE Ganadores han sido ordenados");           
            });
            
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
          console.log("este es el result0 antes" , result[0].ganadores);
          let ganadoresAntiguos = result[0].ganadores;
          console.log("ganadoreAntiguos antes del splice" , ganadoresAntiguos);         
          ganadoresAntiguos.splice(req.body.indice,1);
          console.log("ganadoreAntiguos despues del splice" , ganadoresAntiguos);
          ganadoresAntiguos.push(req.body);
          function  mycomparator(a,b) {
            return (a.indice) - (b.indice);
          }
          let resultadoGanadoresModificados =  ganadoresAntiguos.sort(mycomparator);
          console.log("nuevosganadores despues del push" , resultadoGanadoresModificados);         

          // let nuevoResult= (req.body.resultados)
          // let indice= resultadoGanadoresModificados.indexOf(req.body);
          // console.log("Este es el indexposition",indice);
          // nuevoCombo ={nuevoResult,indice}
          // resultadoGanadoresModificados.splice(indice,1, nuevoCombo);
          // console.log("EStes es el splice del indice",resultadoGanadoresModificados);
          // var dbo = db.db("proyectfinal");
          let actualizarAntiguosGanadores= { $set: { "ganadores": resultadoGanadoresModificados } };

          dbo.collection("Torneos").updateOne({ "ganadores.indice" : { $eq:req.body.indice }},actualizarAntiguosGanadores, function (err, res) {
            if (err) throw err;
            console.log("nuevos ganadores insertados");
          });          
      }
    }); 
  });
});

app.post("/enviarAvatar", function (req, res) {
 
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    let data = req.body;
    console.log("DATA FOTO",data);
  
    let myqueryJugador = { listaJugadores: data.nombreUsuario };

    let myqueryUser = { nombre: data.nombreUsuario };
    let newvaluesUser = { $set: { avatar: data.avatar } };

    dbo
    .collection("imagenesUsuarios")
    .find(myqueryJugador)
    .toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      resultBusqueda = result;
      if (result.length > 0) {        
        isFind = true;
        res.end(JSON.stringify({ stateFind: isFind }));
      }else{
  
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
});

app.post("/EliminarTorneo", function (req, res) {
  console.log("console EliminarTorneo", req.body);  
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    dbo.collection("Torneos").deleteOne({"nombreTorneo":  req.body.nombreTorneo}, function (err, res) {
      if (err) throw err;
      console.log("1 Torneo eliminado");
     
    });
    dbo.dropCollection("Noticias", function(err, delOK) { 
      if (err) throw err; 
      if (delOK) console.log("Collection deleted"); 
      db.close(); 
    });
  });
});


app.post("/ganadoresJornada", function (req, res) {
  console.log("console ganadoresJornada", req.body);
  console.log("esto es req.body.arrayGanadoresJornada" , req.body.arrayGanadoresJornada);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    let newGanadoresJornada = { $push: { "jornadas": req.body.arrayGanadoresJornada } };
    let eliminarGanadoresJornada= { $set: { "ganadores": [] } };

    dbo.collection("Torneos").updateOne({}, newGanadoresJornada , function (err, res) {
      if (err) throw err;
      console.log("Nuevos Ganadores insertados");      
      // db.close();
    });
    dbo.collection("Torneos").updateOne({}, eliminarGanadoresJornada , function (err, res) {
      if (err) throw err;
      console.log("Ganadores eliminados");
      db.close();
    });
    // res.end(JSON.stringify(data));
  });
});

app.post("/crearNoticias", function (req, res) {
  console.log("console GenerarTorneo", req.body);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");

    dbo.collection("Noticias").find( { "texto" : { $eq:req.body.texto }}).toArray(function (err, result) {
      if (err) throw err;
      console.log("este es el resultado" , result)      
        if(result.length === 0){          
          dbo.collection("Noticias").insertOne(req.body, function (err, res) {
            if (err) throw err;
            console.log("1 texto insertado");
          });
      }
    });     
  });
});

app.post("/traerNoticias", function (req, res) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("proyectfinal");
    dbo
      .collection("Noticias")
      .find()
      .toArray(function (err, result) {
        if (err) throw err;
        console.log("TRAERNOTICIAS", result);
        res.end(JSON.stringify(result));
      });
  });
});


var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
});
