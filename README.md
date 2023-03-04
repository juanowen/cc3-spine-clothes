# cc3-spine-clothes
CocosCreator 3.X module that allows you to put sprites on the Spine skeleton

It will not create new nodes with a sprite component for each element of the skeleton's clothing. Instead, a shader is used that overlays clothing textures on top of the skeleton atlas.

First, it allows clothing textures to be embedded directly into the skeleton's Spine tree.
Secondly, you don't need to care about the node hierarchy with clothing sprites. Now this is the responsibility of the Spine itself.

Please note that the .effect file for the shader will be created automatically when the "Clothes" property of this module is changed.
