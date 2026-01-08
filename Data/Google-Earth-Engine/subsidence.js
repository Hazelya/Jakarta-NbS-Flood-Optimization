// Imports
var subsidence_prediction_probability = ee.Image("projects/sat-io/open-datasets/global_subsidence/Final_subsidence_proba_greater_1cm_2013_2019_recoded"),
    subsidence_prediction_recoded = ee.Image("projects/sat-io/open-datasets/global_subsidence/Final_subsidence_prediction_recoded");

// Recode des classes : bornes corrigées
var split1 = subsidence_prediction_recoded.updateMask(subsidence_prediction_recoded.select('b1').lte(1));
var split2 = subsidence_prediction_recoded.updateMask(subsidence_prediction_recoded.select('b1').gt(1).and(subsidence_prediction_recoded.select('b1').lte(3)));
var split3 = subsidence_prediction_recoded.updateMask(subsidence_prediction_recoded.select('b1').gt(3).and(subsidence_prediction_recoded.select('b1').lte(5)));
var split4 = subsidence_prediction_recoded.updateMask(subsidence_prediction_recoded.select('b1').gt(5));

// Palette progressive cohérente
Map.addLayer(split1, {palette: ['D9D9D9']}, 'Subsidence rate <1 cm/yr');
Map.addLayer(split2, {palette: ['FFFFB2']}, 'Subsidence rate 1-3 cm/yr');
Map.addLayer(split3, {palette: ['FD8D3C']}, 'Subsidence rate 4-5 cm/yr');
Map.addLayer(split4, {palette: ['BD0026']}, 'Subsidence rate >5 cm/yr');

// Carte de probabilité : inchangée
var probability_palette = ['FFFFFF', 'ABD9E9', '74ADD1', '4575B4', '313695'];
Map.addLayer(subsidence_prediction_probability, {palette: probability_palette, min: 0, max: 1}, 'Subsidence Prediction Probability', false);

// Fond neutre
var snazzy = require("users/aazuspan/snazzy:styles");
snazzy.addStyle("https://snazzymaps.com/style/132/light-gray", "Grayscale");

// Légende mise à jour
var dict = {
  "names": [
    "<1 cm/an",
    "1-3 cm/an",
    "4-5 cm/an",
    ">5 cm/an",
  ],
  "colors": [
    "D9D9D9",
    "FFFFB2",
    "FD8D3C",
    "BD0026",
  ]
};

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

function addCategoricalLegend(panel, dict, title) {
  var legendTitle = ui.Label({
    value: title,
    style: {
      fontWeight: 'bold',
      fontSize: '18px',
      margin: '0 0 4px 0',
      padding: '0'
    }
  });
  panel.add(legendTitle);
  
  var loading = ui.Label('Loading legend...', {margin: '2px 0 4px 0'});
  panel.add(loading);

  var makeRow = function(color, name) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: color,
        padding: '8px',
        margin: '0 0 4px 0'
      }
    });
    var description = ui.Label({
      value: name,
      style: {margin: '0 0 4px 6px'}
    });
    return ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')
    });
  };
  
  var palette = dict['colors'];
  var names = dict['names'];
  loading.style().set('shown', false);
  
  for (var i = 0; i < names.length; i++) {
    panel.add(makeRow(palette[i], names[i]));
  }
  Map.add(panel);
}

addCategoricalLegend(legend, dict, 'Land Subsidence Rate Yearly (cm)');

// Centre Jakarta
Map.setCenter(106.8456, -6.2088, 10);




// GEOTIFF !!!

// Création d'une image unique avec des valeurs par classe
var classified = split1.multiply(1)
                  .unmask(0)
                  .where(split2.mask(), 2)
                  .where(split3.mask(), 3)
                  .where(split4.mask(), 4);
                  
                  
                  Export.image.toDrive({
  image: classified,
  description: 'Jakarta_Subsidence',
  folder: 'EarthEngine',
  fileNamePrefix: 'Jakarta_Subsidence_Rate',
  region: Map.getBounds(true),
  scale: 30, // adapte à ta résolution d'origine (peut être 10, 30, ou 100 selon ton raster)
  crs: 'EPSG:4326', // ou adapte selon ton besoin (UTM, WGS84, etc.)
  maxPixels: 1e13
});