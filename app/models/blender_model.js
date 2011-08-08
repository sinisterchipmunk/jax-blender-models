/**
 * class BlenderModel < Jax.Model
 * 
 **/
var BlenderModel = (function() {
  return Jax.Model.create({
    after_initialize: function() {
      var self = this;
      self.mesh = new Jax.Mesh({
        material: self.material,
        
        init: function(vertices, colors, texCoords, normals, indices) {
          if (self.data) {
            function push(source, dest) {
              for (i = 0; source && i < source.length; i++)
                dest.push(source[i]);
            }
            
            var i, j;
            for (var meshName in self.data)
            {
              var meshData = self.data[meshName];
              push(meshData.vertices, vertices);
              // push(meshData.colors, colors);
              // push(meshData.textureCoords, texCoords);
              push(meshData.indices, indices);
              
              var smooth = true;
              if (typeof(meshData.smooth) != 'undefined') smooth = meshData.smooth;
              if (smooth)
                push(meshData.normals, normals);
              else {
                // filesize optimization: unsmooth meshes carry only face normals. Convert to vertex normals
                // by simply duplicating them.
                for (i = 0; meshData.normals && i < meshData.normals.length; i += 3) {
                  normals.push(meshData.normals[i], meshData.normals[i+1], meshData.normals[i+2]);
                  normals.push(meshData.normals[i], meshData.normals[i+1], meshData.normals[i+2]);
                  normals.push(meshData.normals[i], meshData.normals[i+1], meshData.normals[i+2]);
                }
              }
              
              self.mesh.default_material = new Jax.Material({layers:[{type:"Lighting"}]});
              
              self.dataRegion = new Jax.DataRegion();
              self.mesh.colorLayers = [];
              for (i = 0; meshData.colors && i < meshData.colors.length; i++) {
                self.mesh.colorLayers[i] = self.dataRegion.map(Float32Array, meshData.colors[i]);
                var buffer = new Jax.DataBuffer(GL_ARRAY_BUFFER, self.mesh.colorLayers[i], 3);
                self.mesh.default_material.addLayer(new Jax.Material.BlenderColorLayer({dataBuffer:buffer}));
              }
            }
          }
        }
      });
      
      if (self.path) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) { // success
              self.data(JSON.parse(xhr.responseText));
            } else { // error
              // queue and raise upon next render, so developer can catch it appropriately
              self.xhrError = xhr.status+" ("+self.method+" "+self.path+" - async: "+self.async+")";
            }
          }
        };
        xhr.open(self.method, self.path, self.async);
        xhr.send(null);
      }
    },
    
    render: function($super, context, options) {
      if (this.data)
        $super(context, options);
      if (this.xhrError) {
        throw new Error("AJAX error: "+this.xhrError);
        this.xhrError = null;
      }
    },
    
    data: function(data) {
      this.data = data;
      this.mesh.rebuild();
    }
  });
})();
