var express = require('express');
var router = express.Router();
var knex = require('../db/knex.js');

/* GET pokemon listing. */
router.get('/', function(req, res, next) {
  knex('trainers')
    .then((trainerList) => {
      knex('pokemon')
        .select('pokemon.name AS pokemonName', 'pokemon.cp', 'pokemon.in_gym', 'pokemon.id', 'trainers.name AS trainerName', 'pokemon.display_image_url', 'trainers.image_url')
        .join('trainers', 'trainers.id', 'pokemon.trainer_id')
        .orderBy('pokemon.id', 'ASC')
        .then((pokemonList) => {
          let messageToPage = '';
          if (req.cookies.message) {
            messageToPage = req.cookies.message;
            res.clearCookie('message');
          }

          let p1 = '';
          let p2 = '';
          if (req.cookies.p1) {
            p1 = req.cookies.p1;
          }
          if (req.cookies.p2) {
            p2 = req.cookies.p2;
          }
          res.render('pokemon/index', { trainers: trainerList, pokemon: pokemonList, player1: p1, player2: p2, message: messageToPage});
        })
    })
    .catch((err) => {
      console.log(err);
    });
})

//CREATES NEW POKEMON
router.post('/', function(req, res, next) {
  if (req.body.name && req.body.cp) {
    let newPokemon = {
      name: req.body.name,
      trainer_id: req.body.trainer_id,
      cp: req.body.cp,
      in_gym: false
    }
    knex('pokemon')
      .insert(newPokemon, '*')
      .then((pokemonAdded) => {
        res.redirect(`/pokemon/${pokemonAdded[0].id}`);
      })
      .catch((err) => {
        console.log(err);
      })
  } else {
    res.cookie('message', 'Uh-oh... Looks like you forgot to fill out one of the fields when trying to create a new Pokemon. Please try again.')
    res.redirect('/pokemon');
  }

});

//READ one pokemon
router.get('/:id', function(req, res) {
  console.log("here 2");
  knex('pokemon')
    .select('pokemon.name AS pokemonName', 'pokemon.cp', 'pokemon.in_gym', 'pokemon.id', 'pokemon.battle_image_url', 'trainers.name AS trainerName')
    .join('trainers', 'trainers.id', 'pokemon.trainer_id')
    .where('pokemon.id', req.params.id)
    .then((pokemonResult) => {
      res.render('pokemon/viewPokemon',  { pokemon: pokemonResult[0]});
    })
    .catch((err) => {
      console.log(err);
    })
});

//EDIT a pokemon
router.get('/:id/edit', function(req, res) {
  knex('pokemon')
    .select('pokemon.name AS pokemonName', 'pokemon.cp', 'pokemon.in_gym', 'pokemon.id', 'trainers.name AS trainerName')
    .join('trainers', 'trainers.id', 'pokemon.trainer_id')
    .where('pokemon.id', req.params.id)
    .then((pokemonResult) => {
      knex('trainers')
        .then((trainerList) => {
          res.render('pokemon/editPokemon',  { pokemon: pokemonResult[0], trainers: trainerList});
        })
    })
    .catch((err) => {
      console.log(err);
    })
});

//EDIT a pokemon (post changes)
router.post('/:id/edit', function(req, res) {
  console.log(req.body);
  let updates = {
    cp: req.body.cp,
    trainer_id: req.body.trainer_id,
    in_gym: req.body.in_gym
  }

  knex('pokemon')
    .update(updates, '*')
    .where('pokemon.id', req.params.id)
    .then((updatedPokemon) => {
      console.log(updatedPokemon);
      res.redirect(`/pokemon/${updatedPokemon[0].id}`);
    })
    .catch((err) => {
      console.log(err);
    })
})


//DELETES pokemon
router.get('/:id/delete', function(req, res) {
  knex('pokemon')
    .where('pokemon.id', req.params.id)
    .del()
    .then(() => {
      if (req.cookies.p1) {
        if (req.cookies.p1 == req.params.id) {
          res.clearCookie('p1');
        }
      }

      if (req.cookies.p2) {
        if (req.cookies.p2 == req.params.id) {
          res.clearCookie('p2');
        }
      }

      res.redirect('/pokemon');
    })
    .catch((err) => {
      console.log(err);
    })
});

// ADDS pokemon to gym
router.post('/:id/addToGym', function(req, res) {
  console.log('req.body from button', req.body);
  if (!req.cookies.p1) {
    res.cookie('p1', req.params.id);

  } else {
    res.cookie('p2', req.params.id);
  }


  knex('pokemon')
    .update({
      in_gym: true,
      updated_at: knex.fn.now()
    })
    .where('pokemon.id', req.params.id)
    .then(() => {
      res.redirect('/pokemon');
    })
    .catch((err) => {
      console.log(err);
    })
});




//REMOVES pokemon from gym
router.post('/:id/removeGym', function(req, res) {
  if (req.params.id == req.cookies.p1) {
    res.clearCookie('p1');
  } else {
    res.clearCookie('p2');
  }
  knex('pokemon')
    .update({ in_gym: false })
    .where('pokemon.id', req.params.id)
    .then(() => {
      res.redirect('/pokemon');
    })
    .catch((err) => {
      console.log(err);
    })

});



module.exports = router;
