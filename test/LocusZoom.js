"use strict";

/**
  LocusZoom.js Core Test Suite
  Test composition of the LocusZoom object and its base classes
*/

var jsdom = require('mocha-jsdom');
var fs = require("fs");
var assert = require('assert');
var should = require("should");
var _files = require('./_files.js');

describe('LocusZoom Core', function(){

    // Load all javascript files
    var src = [];
    _files.forEach(function(_file){ src.push(fs.readFileSync(_file)); });
    jsdom({ src: src });

    // Reset DOM after each test
    afterEach(function(){
        d3.select("body").selectAll("*").remove();
    });

    // Tests
    it("creates an object for its name space", function() {
        should.exist(LocusZoom);
    });

    describe("LocusZoom Core", function() {

        beforeEach(function(){
            d3.select("body").append("div").attr("id", "instance_id");
        });

        afterEach(function(){
            d3.select("body").selectAll("*").remove();
        });

        it('should have a version number', function(){
            LocusZoom.should.have.property('version').which.is.a.String;
        });

        it('should have a method for converting an integer position to a string', function(){
            LocusZoom.positionIntToString.should.be.a.Function;
            assert.equal(LocusZoom.positionIntToString(1, 6),          "0.000001");
            assert.equal(LocusZoom.positionIntToString(1000, 6),       "0.001");
            assert.equal(LocusZoom.positionIntToString(4567, 6),       "0.005");
            assert.equal(LocusZoom.positionIntToString(1000000, 6),    "1.00");
            assert.equal(LocusZoom.positionIntToString(23423456, 6),   "23.42");
            assert.equal(LocusZoom.positionIntToString(1896335235, 6), "1896.34");
            assert.equal(LocusZoom.positionIntToString(8, 3),          "0.008");
            assert.equal(LocusZoom.positionIntToString(4567, 3),       "4.57");
            assert.equal(LocusZoom.positionIntToString(23423456, 3),   "23423.46");
            assert.equal(LocusZoom.positionIntToString(8, 9),          "0.000000008");
            assert.equal(LocusZoom.positionIntToString(4567, 9),       "0.000005");
            assert.equal(LocusZoom.positionIntToString(23423456, 9),   "0.02");
            assert.equal(LocusZoom.positionIntToString(8, 0),          "8");
            assert.equal(LocusZoom.positionIntToString(4567, 0),       "4567");
            assert.equal(LocusZoom.positionIntToString(23423456, 0),   "23423456");
            assert.equal(LocusZoom.positionIntToString(209, null, true),        "209 b");
            assert.equal(LocusZoom.positionIntToString(52667, null, true),      "52.67 Kb");
            assert.equal(LocusZoom.positionIntToString(290344350, null, true),  "290.34 Mb");
            assert.equal(LocusZoom.positionIntToString(1026911427, null, true), "1.03 Gb");
        });

        it('should have a method for converting a string position to an integer', function(){
            LocusZoom.positionStringToInt.should.be.a.Function;
            assert.equal(LocusZoom.positionStringToInt("5Mb"), 5000000);
            assert.equal(LocusZoom.positionStringToInt("1.4Kb"), 1400);
            assert.equal(LocusZoom.positionStringToInt("26.420Mb"), 26420000);
            assert.equal(LocusZoom.positionStringToInt("13"), 13);
            assert.equal(LocusZoom.positionStringToInt("73,054,882"), 73054882);
        });

        it('should have a method for generating pretty ticks', function(){
            LocusZoom.prettyTicks.should.be.a.Function;
            assert.deepEqual(LocusZoom.prettyTicks([0, 10]), [0, 2, 4, 6, 8, 10]);
            assert.deepEqual(LocusZoom.prettyTicks([14, 67]), [10, 20, 30, 40, 50, 60, 70]);
            assert.deepEqual(LocusZoom.prettyTicks([0.01, 0.23]), [0, 0.05, 0.10, 0.15, 0.20, 0.25]);
            assert.deepEqual(LocusZoom.prettyTicks([1, 21], "low", 10), [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
            assert.deepEqual(LocusZoom.prettyTicks([1, 9], "high"), [0, 2, 4, 6, 8]);
            assert.deepEqual(LocusZoom.prettyTicks([-18, 76]), [-20, 0, 20, 40, 60, 80]);
            assert.deepEqual(LocusZoom.prettyTicks([-187, 762]), [-200, 0, 200, 400, 600, 800]);
        });

        it('should have a method for populating a single element with a LocusZoom instance', function(){
            LocusZoom.populate.should.be.a.Function;
            var instance = LocusZoom.populate("#instance_id", {});
            instance.should.be.an.Object;
            instance.id.should.be.exactly("instance_id");
            var svg_selector = d3.select('div#instance_id svg');
            svg_selector.should.be.an.Object;
            svg_selector.size().should.be.exactly(1);
            instance.svg.should.be.an.Object;
            assert.equal(instance.svg.html(), svg_selector.html());
        });

        it('should have a method for populating arbitrarily many elements with LocusZoom instances', function(){
            d3.select("body").append("div").attr("id", "populated_instance_1").attr("class", "lz");
            d3.select("body").append("div").attr("id", "populated_instance_2").attr("class", "lz");
            LocusZoom.populateAll.should.be.a.Function;
            var instances = LocusZoom.populateAll("div.lz");
            d3.selectAll('div.lz').each(function(d, i){
                var div_selector = d3.select(this);
                var svg_selector = div_selector.select("svg");
                svg_selector.should.be.an.Object;
                svg_selector.size().should.be.exactly(1);
                instances[i].svg.should.be.an.Object;
                assert.equal(instances[i].svg.html(), svg_selector.html());
            });
        });

        it('should allow for populating an element with a predefined layout and state as separate arguments (DEPRECATED)', function(){
            var layout = { foo: "bar" };
            var state = { chr: 10 };
            var instance = LocusZoom.populate("#instance_id", {}, layout, state);
            instance.layout.foo.should.be.exactly("bar");
            instance.layout.state.chr.should.be.exactly(10);
            assert.deepEqual(instance.state, instance.layout.state);
        });

        describe("Position Queries", function() {
            it('should have a parsePositionQuery function', function() {
                LocusZoom.parsePositionQuery.should.be.a.Function;
            });
            it("should parse chr:start-end", function() {
                var test = LocusZoom.parsePositionQuery("10:45000-65000");
                test.should.have.property("chr","10");
                test.should.have.property("start",45000);
                test.should.have.property("end",65000);
            });
            it("should parse chr:start+end", function() {
                var test = LocusZoom.parsePositionQuery("10:45000+5000");
                test.should.have.property("chr","10");
                test.should.have.property("start",40000);
                test.should.have.property("end",50000);
            });
            it("should parse kb/mb units", function() {
                var test = LocusZoom.parsePositionQuery("10:5.5Mb+2k");
                test.should.have.property("chr","10");
                test.should.have.property("start",5.5e6-2e3);
                test.should.have.property("end",5.5e6+2e3);
            });
            it("should prase chr:pos", function() {
                var test = LocusZoom.parsePositionQuery("2:5500");
                test.should.have.property("chr","2");
                test.should.have.property("position",5500);
            });
        });

        it('should have a method for creating a CORS promise', function(){
            LocusZoom.createCORSPromise.should.be.a.Function;
        });

        describe("Merge Layouts", function() {
            beforeEach(function(){
                this.default_layout = {
                    scalar_1: 123,
                    scalar_2: "foo",
                    array_of_scalars: [ 4, 5, 6 ],
                    nested_object: {
                        property_1: {
                            alpha: 0,
                            bravo: "foo",
                            charlie: ["delta", "echo"],
                            foxtrot: {
                                golf: "bar",
                                hotel: ["india", "juliet", "kilo"]
                            }
                        },
                        property_2: false,
                        property_3: true
                    }
                };
            });
            it('should have a method for merging two layouts', function(){
                LocusZoom.mergeLayouts.should.be.a.Function;
            });
            it('should throw an exception if either argument is not an object', function(){
                (function(){
                    LocusZoom.mergeLayouts();
                }).should.throw();
                (function(){
                    LocusZoom.mergeLayouts({});
                }).should.throw();
                (function(){
                    LocusZoom.mergeLayouts({}, "");
                }).should.throw();
                (function(){
                    LocusZoom.mergeLayouts(0, {});
                }).should.throw();
                (function(){
                    LocusZoom.mergeLayouts(function(){}, {});
                }).should.throw();
            });
            it('should return the passed default layout if provided an empty layout', function(){
                var returned_layout = LocusZoom.mergeLayouts({}, this.default_layout);
                assert.deepEqual(returned_layout, this.default_layout);
            });
            it('should copy top-level values', function(){
                var custom_layout = { custom_property: "foo" };
                var expected_layout = JSON.parse(JSON.stringify(this.default_layout));
                expected_layout.custom_property = "foo";
                var returned_layout = LocusZoom.mergeLayouts(custom_layout, this.default_layout);
                assert.deepEqual(returned_layout, expected_layout);
            });
            it('should copy deeply-nested values', function(){
                var custom_layout = { nested_object: { property_1: { foxtrot: { sierra: "tango" } } } };
                var expected_layout = JSON.parse(JSON.stringify(this.default_layout));
                expected_layout.nested_object.property_1.foxtrot.sierra = "tango";
                var returned_layout = LocusZoom.mergeLayouts(custom_layout, this.default_layout);
                assert.deepEqual(returned_layout, expected_layout);
            });
            it('should not overwrite array values in the first with any values from the second', function(){
                var custom_layout = {
                    array_of_scalars: [ 4, 6 ],
                    nested_object: {
                        property_1: {
                            charlie: ["whiskey", "xray"]
                        },
                        property_2: true
                    }
                };
                var expected_layout = JSON.parse(JSON.stringify(this.default_layout));
                expected_layout.array_of_scalars = [ 4, 6 ];
                expected_layout.nested_object.property_1.charlie = ["whiskey", "xray"];
                expected_layout.nested_object.property_2 = true;
                var returned_layout = LocusZoom.mergeLayouts(custom_layout, this.default_layout);
                assert.deepEqual(returned_layout, expected_layout);
            });
            it('should allow for the first layout to override any value in the second regardless of type', function(){
                var custom_layout = {
                    array_of_scalars: "number",
                    nested_object: {
                        property_1: {
                            foxtrot: false
                        },
                        property_3: {
                            nested: {
                                something: [ "foo" ]
                            }
                        }
                    }
                };
                var expected_layout = JSON.parse(JSON.stringify(this.default_layout));
                expected_layout.array_of_scalars = "number";
                expected_layout.nested_object.property_1.foxtrot = false;
                expected_layout.nested_object.property_3 = { nested: { something: [ "foo" ] } };
                var returned_layout = LocusZoom.mergeLayouts(custom_layout, this.default_layout);
                assert.deepEqual(returned_layout, expected_layout);
            });
        });

        describe("Parse Fields", function() {
            it('should have a parseFields function', function() {
                LocusZoom.parseFields.should.be.a.Function;
            });
            it('should require that data be present and be an object', function() {
                assert.throws(function(){
                    LocusZoom.parseFields("foo", "html");
                });
                assert.throws(function(){
                    LocusZoom.parseFields(123, "html");
                });
            });
            it('should require that html be present and be a string', function() {
                assert.throws(function(){
                    LocusZoom.parseFields({}, {});
                });
                assert.throws(function(){
                    LocusZoom.parseFields({}, 123);
                });
                assert.throws(function(){
                    LocusZoom.parseFields({}, null);
                });
            });
            it('should return html untouched if passed a null or empty data object', function() {
                assert.equal(LocusZoom.parseFields(null, "foo"), "foo");
                assert.equal(LocusZoom.parseFields({}, "foo"), "foo");
            });
            it("should parse every matching scalar field from a data object into the html string", function() {
                var data, html, expected_value, returned_value;
                data = { field1: 123, field2: "foo" };
                html = "<strong>{{field1}} and {{field2}}</strong>";
                expected_value = "<strong>123 and foo</strong>";
                assert.equal(LocusZoom.parseFields(data, html), expected_value);
                html = "<strong>{{field1}} and {{field2}} or {{field1}}{{field1}}</strong>";
                expected_value = "<strong>123 and foo or 123123</strong>";
                assert.equal(LocusZoom.parseFields(data, html), expected_value);
            });
            it("should skip parsing of non-scalar fields but not throw an error", function() {
                var data, html, expected_value, returned_value;
                data = { field1: 123, field2: "foo", field3: { foo: "bar" }, field4: [ 4, 5, 6 ], field5: true, field6: NaN };
                html = "<strong>{{field1}}, {{field2}}, {{field3}}, {{field4}}, {{field5}}, {{field6}}</strong>";
                expected_value = "<strong>123, foo, {{field3}}, {{field4}}, true, NaN</strong>";
                assert.equal(LocusZoom.parseFields(data, html), expected_value);
            });
        });

        
    });

});
