// src="https://cdn.jsdelivr.net/npm/apexcharts"
// 	!function(){
// 		var t={
// 			21:function(){
// 				!function(){
// 					const t={
// 						init(){
// 							const t={
// 								series:[25,25,50],
// 								labels:["Win","Draws","Losses"],
// 								chart:{
// 									type:"donut",sparkline:{
// 										enabled:!0
// 									}
// 								},
// 								colors:[
// 									"#cccccc",
// 									"#555555",
// 									"#111111"
// 									// "var(--bs-info)",
// 									// "var(--bs-warning)",
// 									// "var(--bs-danger)"
// 								],
// 								plotOptions: {
// 									pie: {
// 										donut: {
// 											size: "80"
// 										}
// 									}
// 								},
// 								tooltip:{y:{formatter(t){return t+"%"}}}
// 							};
// 							new ApexCharts(document.querySelector("#bsb-chart-7"),t).render()
// 						}
// 					};
// 					function e(){t.init()}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",e):e(),window.addEventListener("load",(function(){}),!1)
// 				}()
// 			}
// 		},e={};
// 		function n(r){
// 			var o=e[r];if(void 0!==o)return o.exports;var a=e[r]={exports:{}};return t[r](a,a.exports,n),a.exports
// 		}n.n=function(t){
// 			var e=t&&t.__esModule?function(){
// 				return t.default
// 			}:function(){
// 				return t
// 			};
// 			return n.d(e,{a:e}),e
// 		},n.d=function(t,e){
// 			for(var r in e)n.o(e,r)&&!n.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})
// 		},n.o=function(t,e){
// 			return Object.prototype.hasOwnProperty.call(t,e)
// 		},function(){
// 			"use strict";n(21)
// 		}()
// 	}();

	// var progress = document.getElementById("myProgress");
	// var progressValue = 0.8; // progress
	// progress.style.width = progressValue * 100 + "%";

	function showEdit() {
		document.getElementById("popUp").style.display = 'block';
	}
	function doneEdit() {
		document.getElementById("popUp").style.display = 'none';
	}