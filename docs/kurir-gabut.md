# Little Courier / Kurir Gabut

Original browser delivery game with a shoulder-height third-person camera.

- Neighborhood dimensions doubled from the preceding version (200% scale, four times the area). Twenty-four houses, connected roads, alleys, parking approaches, markets, trees, porches, sky and clouds.
- Five timed deliveries. Deadlines derive from reachable street distances and decrease by at least eight seconds per level. Countdown begins after collection. Crash recovery costs three seconds; running out of time ends the run.
- Start on a motorcycle. W/S or up/down move, A/D or left/right turn, Shift boosts, space brakes, B mounts/dismounts while stopped. Equivalent touch controls and tap-to-route are available. Park near the door, walk up, press E or Knock, then wait for the resident to emerge. The parcel appears in a backpack only while carried.
- Bottom-right north-up minimap shows player heading, destination, distance, parked motorcycle, and dogs. The dotted line indicates bearing, not a road route. The existing world marker and compass point toward the delivery.
- Top-right scene selector: morning, noon, evening, night. Levels progress through clear, clear, rain, wind, and storm. Wet roads reduce speed and braking; wind adds mild drift. Night lights preserve visibility.
- Eight pedestrians (including two on a crossing), three cars, two passing motorcycles, and two guard dogs. Pedestrians step aside when a fast rider approaches. Traffic yields. Dogs pursue within seven meters, stop when separation exceeds sixteen meters or the rider is twenty-three meters from their home, then return with a cooldown.
- Lazy-loaded Rapier swept character collisions stop tunneling through buildings, street props, vehicles and actors. Rounded collision proxies approximate visible shapes. NPC residents may cross their own doorway during the opening animation. Crash feedback uses a brief tilt, dust, reduced control, and a cooldown.
- Procedural rounded models, human joints, vehicle fittings, textured plaster/roofs/asphalt, roughness-based wet roads and contact shadows. This remains stylized 3D, without photorealistic downloaded models.
- Performance: shared/merged geometry, instanced moving tree canopies, 64px generated surface textures, fixed actor counts, 160 rain segments and 24 dust points. Pixel ratio capped at 1.5, rendering capped at 40 fps. No shadow maps or post-processing; one local headlight at night. Geometry tests require fewer than 500 mesh objects and 200,000 rendered triangles including instances. All physics, graphics, listeners and frame loops are disposed.
- React owns the shell only. Simulation, map routing, deadlines and rendering remain separate. ID/EN supported. No account, backend, saved progress or external asset downloads. Excluded from the short Daily lineup.

Verification covers route connectivity, distance-derived deadlines, swept collisions, riding transitions, dog leash, pedestrian avoidance, weather braking, door interactions, all five deliveries, lifecycle cleanup, localization and rendering budgets. Browser performance depends on device; the caps are budgets rather than a guaranteed frame rate.
