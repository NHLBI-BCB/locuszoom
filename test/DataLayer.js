/* global require, describe, d3, LocusZoom, beforeEach, afterEach, it */

"use strict";

/**
  DataLayer.js Tests
  Test composition of the LocusZoom.Panel object and its base classes
*/

var jsdom = require("mocha-jsdom");
var fs = require("fs");
var assert = require("assert");
var should = require("should");
var files = require("../files.js");

describe("LocusZoom.DataLayer", function(){

    // Load all javascript files
    var src = [];
    files.test_include.forEach(function(file){ src.push(fs.readFileSync(file)); });
    jsdom({ src: src });

    // Reset DOM after each test
    afterEach(function(){
        d3.select("body").selectAll("*").remove();
    });

    // Tests
    it("creates an object for its name space", function() {
        should.exist(LocusZoom.DataLayer);
    });

    it("defines its layout defaults", function() {
        LocusZoom.DataLayer.should.have.property("DefaultLayout").which.is.an.Object;
    });

    describe("Constructor", function() {
        beforeEach(function() {
            this.datalayer = new LocusZoom.DataLayer();
        });
        it("returns an object", function() {
            this.datalayer.should.be.an.Object;
        });
        it("should have an id", function(){
            this.datalayer.should.have.property("id");
        });
        it("should have an array for caching data", function(){
            this.datalayer.should.have.property("data").which.is.an.Array;
        });
        it("should have an svg object", function(){
            this.datalayer.should.have.property("svg").which.is.an.Object;
        });
        it("should have a layout object", function(){
            this.datalayer.should.have.property("layout").which.is.an.Object;
        });
        it("should have a state object", function(){
            this.datalayer.should.have.property("state").which.is.an.Object;
        });
    });

    describe("Scalable parameter resolution", function() {
        it("has a method to resolve scalable parameters into discrete values", function() {
            this.datalayer = new LocusZoom.DataLayer({ id: "test" });
            this.datalayer.resolveScalableParameter.should.be.a.Function;
        });
        it("passes numbers and strings directly through regardless of data", function() {
            this.datalayer = new LocusZoom.DataLayer({ id: "test" });
            this.layout = { scale: "foo" };
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, {}), "foo");
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { foo: "bar" }), "foo");
            this.layout = { scale: 17 };
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, {}), 17);
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { foo: "bar" }), 17);
        });
        it("executes a scale function for the data provided", function() {
            this.datalayer = new LocusZoom.DataLayer({ id: "test" });
            this.layout = {
                scale: {
                    scale_function: "categorical_bin",
                    field: "test",
                    parameters: {
                        categories: ["lion", "tiger", "bear"],
                        values: ["dorothy", "toto", "scarecrow"]
                    }
                }
            };
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { test: "lion" }), "dorothy");
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { test: "manatee" }), null);
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, {}), null);
        });
        it("iterates over an array of options until exhausted or a non-null value is found", function() {
            this.datalayer = new LocusZoom.DataLayer({ id: "test" });
            this.layout = {
                scale: [
                    {
                        scale_function: "if",
                        field: "test",
                        parameters: {
                            field_value: "wizard",
                            then: "oz"
                        }
                    },
                    {
                        scale_function: "categorical_bin",
                        field: "test",
                        parameters: {
                            categories: ["lion", "tiger", "bear"],
                            values: ["dorothy", "toto", "scarecrow"]
                        }
                    },
                    "munchkin"
                ]
            };
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { test: "wizard" }), "oz");
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { test: "tiger" }), "toto");
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, { test: "witch" }), "munchkin");
            assert.equal(this.datalayer.resolveScalableParameter(this.layout.scale, {}), "munchkin");
        });
    });

    describe("Extent generation", function() {
        it("has a method to generate an extent function for any axis", function() {
            this.datalayer = new LocusZoom.DataLayer({ id: "test" });
            this.datalayer.getAxisExtent.should.be.a.Function;
        });
        it("throws an error on invalid axis identifiers", function() {
            var datalayer = new LocusZoom.DataLayer({ id: "test" });
            assert.throws(function(){ datalayer.getAxisExtent(); });
            assert.throws(function(){ datalayer.getAxisExtent("foo"); });
            assert.throws(function(){ datalayer.getAxisExtent(1); });
            assert.throws(function(){ datalayer.getAxisExtent("y1"); });
        });
        it("generates an accurate extent array for arbitrary data sets", function() {
            this.layout = {
                id: "test",
                x_axis: { field: "x" }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [1, 4]);
            this.datalayer.data = [
                { x: 200 }, { x: -73 }, { x: 0 }, { x: 38 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [-73, 200]);
            this.datalayer.data = [
                { x: 6 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [6, 6]);
            this.datalayer.data = [
                { x: "apple" }, { x: "pear" }, { x: "orange" }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [undefined, undefined]);
        });
        it("applies upper and lower buffers to extents as defined in the layout", function() {
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    lower_buffer: 0.05
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [0.85, 4]);
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    upper_buffer: 0.2
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 62 }, { x: 7 }, { x: -18 }, { x: 106 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [-18, 130.8]);
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    lower_buffer: 0.35,
                    upper_buffer: 0.6
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 95 }, { x: 0 }, { x: -4 }, { x: 256 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [-95, 412]);
        });
        it("applies a minimum extent as defined in the layout", function() {
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    min_extent: [ 0, 3 ]
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [0, 4]);
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    upper_buffer: 0.1,
                    lower_buffer: 0.2,
                    min_extent: [ 0, 10 ]
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 3 }, { x: 4 }, { x: 5 }, { x: 6 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [0, 10]);
            this.datalayer.data = [
                { x: 0.6 }, { x: 4 }, { x: 5 }, { x: 9 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [-1.08, 10]);
            this.datalayer.data = [
                { x: 0.4 }, { x: 4 }, { x: 5 }, { x: 9.8 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [-1.48, 10.74]);
        });
        it("applies hard floor and ceiling as defined in the layout", function() {
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    min_extent: [6, 10],
                    lower_buffer: 0.5,
                    floor: 0
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 8 }, { x: 9 }, { x: 8 }, { x: 8.5 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [0, 10]);
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    min_extent: [0, 10],
                    upper_buffer: 0.8,
                    ceiling: 5
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 3 }, { x: 4 }, { x: 5 }, { x: 6 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [0, 5]);
            this.layout = {
                id: "test",
                x_axis: {
                    field: "x",
                    min_extent: [0, 10],
                    lower_buffer: 0.8,
                    upper_buffer: 0.8,
                    floor: 4,
                    ceiling: 6
                }
            };
            this.datalayer = new LocusZoom.DataLayer(this.layout);
            this.datalayer.data = [
                { x: 2 }, { x: 4 }, { x: 5 }, { x: 17 }
            ];
            assert.deepEqual(this.datalayer.getAxisExtent("x"), [4, 6]);
        });

    });

    describe("Layout Paramters", function() {
        beforeEach(function(){
            this.plot = null;
            this.layout = {
                panels: [
                    {
                        id: "p1",
                        data_layers: []
                    }
                ],
                controls: false
            };
            d3.select("body").append("div").attr("id", "plot");
        });
        afterEach(function(){
            d3.select("#plot").remove();
            delete this.plot;
        });
        it("should allow for explicitly setting data layer z_index", function(){
            this.layout.panels[0].data_layers = [
                { id: "d1", type: "line", z_index: 1 },
                { id: "d2", type: "line", z_index: 0 }
            ];
            this.plot = LocusZoom.populate("#plot", {}, this.layout);
            assert.deepEqual(this.plot.panels.p1.data_layer_ids_by_z_index, ["d2", "d1"]);
            this.plot.panels.p1.data_layers.d1.layout.z_index.should.be.exactly(1);
            this.plot.panels.p1.data_layers.d2.layout.z_index.should.be.exactly(0);
        });
        it("should allow for explicitly setting data layer z_index with a negative value", function(){
            this.layout.panels[0].data_layers = [
                { id: "d1", type: "line" },
                { id: "d2", type: "line" },
                { id: "d3", type: "line" },
                { id: "d4", type: "line", z_index: -1 }
            ];
            this.plot = LocusZoom.populate("#plot", {}, this.layout);
            assert.deepEqual(this.plot.panels.p1.data_layer_ids_by_z_index, ["d1", "d2", "d4", "d3"]);
            this.plot.panels.p1.data_layers.d1.layout.z_index.should.be.exactly(0);
            this.plot.panels.p1.data_layers.d2.layout.z_index.should.be.exactly(1);
            this.plot.panels.p1.data_layers.d3.layout.z_index.should.be.exactly(3);
            this.plot.panels.p1.data_layers.d4.layout.z_index.should.be.exactly(2);
        });
    });

    describe("Highlight functions", function() {
        beforeEach(function(){
            this.plot = null;
            var data_sources = new LocusZoom.DataSources()
                .add("d", ["StaticJSON", [{ id: "a" }, { id: "b" },{ id: "c" }] ]);
            var layout = {
                panels: [
                    {
                        id: "p",
                        data_layers: [
                            {
                                id: "d",
                                fields: ["d:id"],
                                id_field: "d:id",
                                type: "scatter",
                                highlighted: { onmouseover: "toggle" }
                            }
                        ]
                    }
                ],
                controls: false
            };
            d3.select("body").append("div").attr("id", "plot");
            this.plot = LocusZoom.populate("#plot", data_sources, layout);
        });
        afterEach(function(){
            d3.select("#plot").remove();
            delete this.plot;
        });
        it("should allow for highlighting and unhighlighting a single element", function(){
            this.plot.lzd.getData({}, ["d:id"])
                .then(function(){
                    var state_id = this.plot.panels.p.data_layers.d.state_id;
                    var d = this.plot.panels.p.data_layers.d;
                    var a = d.data[0];
                    var a_id = d.getElementId(a);
                    var b = d.data[1];
                    var c = d.data[2];
                    var c_id = d.getElementId(c);
                    this.plot.state[state_id].highlighted.should.be.an.Array;
                    this.plot.state[state_id].highlighted.length.should.be.exactly(0);
                    this.plot.panels.p.data_layers.d.highlightElement(a);
                    this.plot.state[state_id].highlighted.length.should.be.exactly(1);
                    this.plot.state[state_id].highlighted[0].should.be.exactly(a_id);
                    this.plot.panels.p.data_layers.d.unhighlightElement(a);
                    this.plot.state[state_id].highlighted.length.should.be.exactly(0);
                    this.plot.panels.p.data_layers.d.highlightElement(c);
                    this.plot.state[state_id].highlighted.length.should.be.exactly(1);
                    this.plot.state[state_id].highlighted[0].should.be.exactly(c_id);
                    this.plot.panels.p.data_layers.d.unhighlightElement(b);
                    this.plot.state[state_id].highlighted.length.should.be.exactly(1);
                    this.plot.panels.p.data_layers.d.unhighlightElement(c);
                    this.plot.state[state_id].highlighted.length.should.be.exactly(0);
                }.bind(this));
        });
        it("should allow for highlighting and unhighlighting all elements", function(){
            this.plot.lzd.getData({}, ["d:id"])
                .then(function(){
                    var state_id = this.plot.panels.p.data_layers.d.state_id;
                    var d = this.plot.panels.p.data_layers.d;
                    var a_id = d.getElementId(d.data[0]);
                    var b_id = d.getElementId(d.data[1]);
                    var c_id = d.getElementId(d.data[2]);
                    this.plot.panels.p.data_layers.d.highlightAllElements();
                    this.plot.state[state_id].highlighted.length.should.be.exactly(3);
                    this.plot.state[state_id].highlighted[0].should.be.exactly(a_id);
                    this.plot.state[state_id].highlighted[1].should.be.exactly(b_id);
                    this.plot.state[state_id].highlighted[2].should.be.exactly(c_id);
                    this.plot.panels.p.data_layers.d.unhighlightAllElements();
                    this.plot.state[state_id].highlighted.length.should.be.exactly(0);
                }.bind(this));
        });
    });

    describe("Select functions", function() {
        beforeEach(function(){
            this.plot = null;
            var data_sources = new LocusZoom.DataSources()
                .add("d", ["StaticJSON", [{ id: "a" }, { id: "b" },{ id: "c" }] ]);
            var layout = {
                panels: [
                    {
                        id: "p",
                        data_layers: [
                            {
                                id: "d",
                                fields: ["d:id"],
                                id_field: "d:id",
                                type: "scatter",
                                selected: { onclick: "toggle" }
                            }
                        ]
                    }
                ],
                controls: false
            };
            d3.select("body").append("div").attr("id", "plot");
            this.plot = LocusZoom.populate("#plot", data_sources, layout);
        });
        afterEach(function(){
            d3.select("#plot").remove();
            delete this.plot;
        });
        it("should allow for selecting and unselecting a single element", function(){
            this.plot.lzd.getData({}, ["d:id"])
                .then(function(){
                    var state_id = this.plot.panels.p.data_layers.d.state_id;
                    var d = this.plot.panels.p.data_layers.d;
                    var a = d.data[0];
                    var a_id = d.getElementId(a);
                    var b = d.data[1];
                    var c = d.data[2];
                    var c_id = d.getElementId(c);
                    this.plot.state[state_id].selected.should.be.an.Array;
                    this.plot.state[state_id].selected.length.should.be.exactly(0);
                    this.plot.panels.p.data_layers.d.selectElement(a);
                    this.plot.state[state_id].selected.length.should.be.exactly(1);
                    this.plot.state[state_id].selected[0].should.be.exactly(a_id);
                    this.plot.panels.p.data_layers.d.unselectElement(a);
                    this.plot.state[state_id].selected.length.should.be.exactly(0);
                    this.plot.panels.p.data_layers.d.selectElement(c);
                    this.plot.state[state_id].selected.length.should.be.exactly(1);
                    this.plot.state[state_id].selected[0].should.be.exactly(c_id);
                    this.plot.panels.p.data_layers.d.unselectElement(b);
                    this.plot.state[state_id].selected.length.should.be.exactly(1);
                    this.plot.panels.p.data_layers.d.unselectElement(c);
                    this.plot.state[state_id].selected.length.should.be.exactly(0);
                }.bind(this));
        });
        it("should allow for selecting and unselecting all elements", function(){
            this.plot.lzd.getData({}, ["d:id"])
                .then(function(){
                    var state_id = this.plot.panels.p.data_layers.d.state_id;
                    var d = this.plot.panels.p.data_layers.d;
                    var a_id = d.getElementId(d.data[0]);
                    var b_id = d.getElementId(d.data[1]);
                    var c_id = d.getElementId(d.data[2]);
                    this.plot.panels.p.data_layers.d.selectAllElements();
                    this.plot.state[state_id].selected.length.should.be.exactly(3);
                    this.plot.state[state_id].selected[0].should.be.exactly(a_id);
                    this.plot.state[state_id].selected[1].should.be.exactly(b_id);
                    this.plot.state[state_id].selected[2].should.be.exactly(c_id);
                    this.plot.panels.p.data_layers.d.unselectAllElements();
                    this.plot.state[state_id].selected.length.should.be.exactly(0);
                }.bind(this));
        });
    });

    describe("Tool tip functions", function() {
        beforeEach(function(){
            this.plot = null;
            this.layout = {
                panels: [
                    {
                        id: "p",
                        data_layers: []
                    }
                ],
                controls: false
            };
            d3.select("body").append("div").attr("id", "plot");
            this.plot = LocusZoom.populate("#plot", {}, this.layout);
        });
        afterEach(function(){
            d3.select("#plot").remove();
            delete this.plot;
        });
        it("should allow for creating and destroying tool tips", function(){
            this.plot.panels.p.addDataLayer({
                id: "d",
                type: "scatter",
                tooltip: {
                    html: "foo"
                }
            });
            this.plot.panels.p.data_layers.d.data = [{ id: "a" }, { id: "b" },{ id: "c" }];
            this.plot.panels.p.data_layers.d.positionTooltip = function(){ return 0; };
            var a = this.plot.panels.p.data_layers.d.data[0];
            var a_id = this.plot.panels.p.data_layers.d.getElementId(a);
            var a_id_q = "#" + (a_id+"-tooltip").replace(/(:|\.|\[|\]|,)/g, "\\$1");
            this.plot.panels.p.data_layers.d.tooltips.should.be.an.Object;
            Object.keys(this.plot.panels.p.data_layers.d.tooltips).length.should.be.exactly(0);
            this.plot.panels.p.data_layers.d.createTooltip(a);
            this.plot.panels.p.data_layers.d.tooltips[a_id].should.be.an.Object;
            Object.keys(this.plot.panels.p.data_layers.d.tooltips).length.should.be.exactly(1);
            assert.equal(d3.select(a_id_q).empty(), false);
            this.plot.panels.p.data_layers.d.destroyTooltip(a_id);
            Object.keys(this.plot.panels.p.data_layers.d.tooltips).length.should.be.exactly(0);
            assert.equal(typeof this.plot.panels.p.data_layers.d.tooltips[a_id], "undefined");
            assert.equal(d3.select(a_id_q).empty(), true);
        });
        it("should allow for showing or hiding a tool tip based on layout directives and element status", function(){
            this.plot.panels.p.addDataLayer({
                id: "d",
                type: "scatter",
                highlighted: { onmouseover: "toggle" },
                selected: { onclick: "toggle" },
                tooltip: {
                    show: { or: ["highlighted", "selected"] },
                    hide: { and: ["unhighlighted", "unselected"] },
                    html: ""
                }
            });
            this.plot.panels.p.data_layers.d.data = [{ id: "a" }, { id: "b" },{ id: "c" }];
            this.plot.panels.p.data_layers.d.positionTooltip = function(){ return 0; };
            var d = this.plot.panels.p.data_layers.d;
            var a = d.data[0];
            var a_id = d.getElementId(a);
            var b = d.data[1];
            var b_id = d.getElementId(b);
            // Make sure the tooltips object is there
            d.should.have.property("tooltips").which.is.an.Object;
            // Test highlighted OR selected
            should(d.tooltips[a_id]).be.type("undefined");
            d.highlightElement(a);
            should(d.tooltips[a_id]).be.an.Object;
            d.unhighlightElement(a);
            should(d.tooltips[a_id]).be.type("undefined");
            d.selectElement(a);
            should(d.tooltips[a_id]).be.an.Object;
            d.unselectElement(a);
            should(d.tooltips[a_id]).be.type("undefined");
            // Test highlight AND selected
            should(d.tooltips[b_id]).be.type("undefined");
            d.highlightElement(b);
            d.selectElement(b);
            should(d.tooltips[a_id]).be.an.Object;
            d.unhighlightElement(b);
            d.unselectElement(b);
            should(d.tooltips[b_id]).be.type("undefined");
        });
    });

    describe("Data Layers collection object", function() {
        it("LocusZoom should have a DataLayers collection object", function(){
            LocusZoom.should.have.property("DataLayers").which.is.an.Object;
        });
        it("should have a method to list available data layers", function(){
            LocusZoom.DataLayers.should.have.property("list").which.is.a.Function;
            var returned_list = LocusZoom.DataLayers.list();
            var expected_list = ["scatter", "line", "genes", "intervals"];
            assert.deepEqual(returned_list, expected_list);
        });
        it("should have a general method to get a data layer by name", function(){
            LocusZoom.DataLayers.should.have.property("get").which.is.a.Function;
        });
        it("should have a method to add a data layer", function(){
            LocusZoom.DataLayers.should.have.property("add").which.is.a.Function;
            var foo = function(layout){
                LocusZoom.DataLayer.apply(this, arguments);
                this.DefaultLayout = {};
                this.layout = LocusZoom.Layouts.merge(layout, this.DefaultLayout);
                this.render = function(){ return "foo"; };
                return this;
            };
            LocusZoom.DataLayers.add("foo", foo);
            var returned_list = LocusZoom.DataLayers.list();
            var expected_list = ["scatter", "line", "genes", "intervals", "foo"];
            assert.deepEqual(returned_list, expected_list);
            var returned_value = LocusZoom.DataLayers.get("foo", { id: "bar" });
            var expected_value = new foo({ id: "bar" });
            assert.equal(returned_value.id, expected_value.id);
            assert.deepEqual(returned_value.layout, expected_value.layout);
            assert.equal(returned_value.render(), expected_value.render());
        });
        it("should have a method to change or delete existing data layers", function(){
            LocusZoom.DataLayers.should.have.property("set").which.is.a.Function;
            var foo_new = function(layout){
                LocusZoom.DataLayer.apply(this, arguments);
                this.DefaultLayout = { foo: "bar" };
                this.layout = LocusZoom.Layouts.merge(layout, this.DefaultLayout);
                this.render = function(){ return "bar"; };
                return this;
            };
            LocusZoom.DataLayers.set("foo", foo_new);
            var returned_list = LocusZoom.DataLayers.list();
            var expected_list = ["scatter", "line", "genes", "intervals", "foo"];
            assert.deepEqual(returned_list, expected_list);
            var returned_value = LocusZoom.DataLayers.get("foo", { id: "baz" });
            var expected_value = new foo_new({ id: "baz" });
            assert.equal(returned_value.id, expected_value.id);
            assert.deepEqual(returned_value.layout, expected_value.layout);
            assert.equal(returned_value.render(), expected_value.render());
            LocusZoom.DataLayers.set("foo");
            returned_list = LocusZoom.DataLayers.list();
            expected_list = ["scatter", "line", "genes", "intervals"];
            assert.deepEqual(returned_list, expected_list);
        });
        it("should throw an exception if asked to get a function that has not been defined", function(){
            assert.throws(function(){
                LocusZoom.DataLayers.get("nonexistent", this.plot.state);
            });
        });
        it("should throw an exception when trying to add a new data layer that is not a function", function(){
            assert.throws(function(){
                LocusZoom.DataLayers.add("nonfunction", "foo");
            });
        });
        it("should throw an exception when adding a new data layer with an already in use name", function(){
            assert.throws(function(){
                var foo = function(layout){
                    LocusZoom.DataLayer.apply(this, arguments);
                    this.DefaultLayout = {};
                    this.layout = LocusZoom.Layouts.merge(layout, this.DefaultLayout);
                    this.render = function(){ return "foo"; };
                    return this;
                };
                LocusZoom.DataLayers.add("scatter", foo);
            });
        });
        it("should throw an exception if asked to get a data layer without passing both an ID and a layout", function(){
            assert.throws(function(){
                LocusZoom.DataLayers.get("scatter");
            });
            assert.throws(function(){
                LocusZoom.DataLayers.get("scatter", "foo");
            });
        });
        describe("predefined data layers", function() {
            beforeEach(function(){
                this.list = LocusZoom.DataLayers.list();
            });
            it("should each take its ID from the arguments provided", function(){
                this.list.forEach(function(name){
                    var foo = new LocusZoom.DataLayers.get(name, { id: "foo" });
                    assert.equal(foo.id, "foo");
                });
            });
            it("should each take its layout from the arguments provided and mergit with a built-in DefaultLayout", function(){
                this.list.forEach(function(name){
                    var layout = { id: "foo", test: 123 };
                    var foo = new LocusZoom.DataLayers.get(name, layout);
                    var expected_layout = LocusZoom.Layouts.merge(layout, foo.DefaultLayout);
                    assert.deepEqual(foo.layout, expected_layout);
                });
            });
            it("should each implement a render function", function(){
                this.list.forEach(function(name){
                    var foo = new LocusZoom.DataLayers.get(name, { id: "foo" });
                    foo.should.have.property("render").which.is.a.Function;
                });
            });
        });
    });

});
