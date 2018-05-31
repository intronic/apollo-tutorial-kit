import casual from 'casual';
import _ from 'lodash';
const gstore = require('gstore-node')();
const Datastore = require('@google-cloud/datastore');

const datastore = new Datastore({
    projectId: 'xing-technologies',
});

// Then connect gstore to the datastore instance
gstore.connect(datastore);


var conn = {
  dialect:  process.env.DB_DIALECT,  // sqlite | mysql |...
  host:     process.env.DB_HOST,     // mysql
  storage:  process.env.DB_STORAGE   // sqlite only: './blog.sqlite',
}
console.log(">> Conn", process.env.DB_DATABASE, process.env.DB_USER, conn)
const db = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, conn);

const AuthorModel = db.define('author', {
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
});

const PostModel = db.define('post', {
  title: { type: Sequelize.STRING },
  text: { type: Sequelize.STRING },
});

AuthorModel.hasMany(PostModel);
PostModel.belongsTo(AuthorModel);

const mongo = Mongoose.connect('mongodb://localhost/views', {
  useMongoClient: true
});

const ViewSchema = Mongoose.Schema({
  postId: Number,
  views: Number,
});

const FortuneCookie = {
  getOne() {
    return fetch('http://fortunecookieapi.herokuapp.com/v1/cookie') 
      .then(res => res.json())
      .then(res => {
        return res[0].fortune.message;
      });
  },
};

// create mock data with a seed, so we always get the same
casual.seed(123);
db.sync({ force: true }).then(() => {
  _.times(10, () => {
    return AuthorModel.create({
      firstName: casual.first_name,
      lastName: casual.last_name,
    }).then((author) => {
      return author.createPost({
        title: `A post by ${author.firstName}`,
        text: casual.sentences(3),
      }).then((post) => { // <- the new part starts here
        // create some View mocks
        return View.update(
          { postId: post.id },
          { views: casual.integer(0, 100) },
          { upsert: true });
      });
    });
  });
});

const View = Mongoose.model('views', ViewSchema);
const Author = db.models.author;
const Post = db.models.post;

export { Author, Post, View, FortuneCookie };