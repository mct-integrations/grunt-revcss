var	revfn,
	sinon = require('sinon'),
	fs = require('fs-extra'),
	chai = require('chai'),
	expect = chai.expect;

var mockgrunt = {
	registerTask: function(name, desc, fn){
		revfn = fn;
	},
	filerev: {
		summary: {
			//Mocks of the references that will be replaced
			'test.css' : '1234abcd.test.css'
		}
	},
}


require('../tasks/revcss')(mockgrunt);

describe('revcss', function() {
	before(function(){
		sinon.stub(fs, 'writeFileSync');
		sinon.stub(fs, 'writeFile', function(filename, tmpl, callback){
			callback();
		});
	})

	it('should write the PHP CSS Map');

	it('should replace references in the css files', function(done){
		var cb = function(err){
			if (err) {return done(err)};
			//Here's the expectations
			expect(fs.writeFileSync.getCall(0).args[1]).to.match(/1234abcd.test.css/);
			//Then we're done
			done();
		}

		revfn.call({
			async: function(){
				return cb;
			}
		})
	})
})