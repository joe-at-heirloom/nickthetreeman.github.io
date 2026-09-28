const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  const out = path.resolve('output/upgrade-qa'); fs.mkdirSync(out, {recursive: true});
  const server = process.env.GAME_URL ? null : require('./serve').createGameServer();
  if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.GAME_URL || `http://127.0.0.1:${server.address().port}`;
  await page.goto(base + '/?test=1');
  const state = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const advance = async ms => page.evaluate(ms => window.advanceTime(ms), ms);
  const action = async action => { await page.locator(`[data-action="${action}"]:visible`).first().click(); await advance(180); };
  await page.screenshot({ path: path.join(out, '01-menu.png'), fullPage: true });
  await action('start');
  await page.screenshot({ path: path.join(out, '02-playing.png'), fullPage: true });
  let current = await state();
  assert.equal(current.mode, 'playing');
  assert(current.trees.every(t => t.safeDirections.length > 0));
  fs.writeFileSync(path.join(out, 'initial-state.json'), JSON.stringify(current, null, 2));
  if (process.argv.includes('--smoke')) {
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ok:true, smoke:true, treeSafety:current.trees.map(t=>[t.id,t.safeDirections]), screenshots:out }));
    await browser.close(); server?.close(); return;
  }
  const key = async k => { await page.keyboard.press(k); await advance(180); };
  const selected = s => s.trees.find(t => t.id === s.selectedTreeId);
  const checks = [];
  // Help and pause must stop every simulation clock and branch interaction.
  await action('help');
  const beforeHelp = await state(); await advance(5000);
  assert.equal((await state()).jobTime, beforeHelp.jobTime);
  await page.screenshot({path:path.join(out,'03-field-guide.png'),fullPage:true});
  await key('Escape'); assert.equal((await state()).overlay, null);
  await key('p'); const paused = await state();
  await advance(3000); await key('a');
  assert.equal((await state()).jobTime, paused.jobTime);
  assert.equal((await state()).totals.limbsCut, paused.totals.limbsCut);
  await key('p'); assert.equal((await state()).paused, false);
  checks.push('pause, resume, help, frozen timer and input');
  await key('2'); assert.equal((await state()).activeTier, 'high');
  await key('1'); assert.equal((await state()).activeTier, 'low');
  await key('e'); assert.equal(selected(await state()).wedge, 1);
  await key('q'); assert.equal(selected(await state()).wedge, -1);
  await key('w'); assert.equal(selected(await state()).wedge, 0);
  await key('Tab'); assert.notEqual((await state()).selectedTreeId,current.selectedTreeId);
  await key('Shift+Tab'); assert.equal((await state()).selectedTreeId,current.selectedTreeId);
  await key('Space'); assert.equal((await state()).nick.airborne,true);
  await advance(1200); assert.equal((await state()).nick.airborne,false);
  await key('v'); await advance(600); assert.equal((await state()).nick.showtime,true);
  await page.screenshot({path:path.join(out,'04-fiddle.png'),fullPage:true});
  await key('v'); assert.equal((await state()).nick.showtime,false);
  checks.push('tiers, wedges, cycling, jumping, fiddle');
  // Direct pointer tap applies damage, then severs a real branch on a second hit.
  async function tapBranch(branch) {
    const box=await page.locator('#game').boundingBox(),q=branch.segment;
    const x=q.x1+(q.x2-q.x1)*.43,y=q.y1+(q.y2-q.y1)*.43;
    await page.mouse.click(box.x+x*box.width/1280,box.y+y*box.height/720); await advance(180);
  }
  let t=selected(await state()),b=t.branches.find(b=>b.side===1&&b.tier==='low');
  await tapBranch(b);
  let damaged=selected(await state()).branches.find(q=>q.id===b.id);
  assert(damaged.hp < b.hp && damaged.hp > 0);
  await tapBranch(damaged); assert.equal((await state()).totals.limbsCut,1);
  // Keyboard cut the upper right limb; imbalance should bring the first tree down left.
  await key('2'); await key('d'); await key('d');
  current=await state(); assert.equal(current.totals.limbsCut,2);
  assert(current.trees[0].falling); assert(current.score>=150);
  await page.screenshot({path:path.join(out,'05-timber.png'),fullPage:true});
  await advance(5000); current=await state();
  assert(current.trees[0].fallen); assert(current.trees[0].angle<0); assert.equal(current.mode,'playing');
  assert(current.score>=450);
  checks.push('pointer branch durability, keyboard cuts, natural safe fall, points');
  // Complete a tree entirely through normal UI actions. No hidden state mutations.
  async function fellSelected(direction=null, capture=false) {
    let snapshot=await state(),tree=selected(snapshot);
    if (!tree || tree.fallen) return;
    const desired=direction || tree.safeDirections[0];
    await action('axe');
    for(let n=0;n<30;n++){
      snapshot=await state();tree=snapshot.trees.find(t=>t.id===tree.id);
      if(tree.falling||tree.fallen||snapshot.mode!=='playing')break;
      const side=tree.axe.stage==='backcut' ? -tree.axe.targetSide : tree.axe.targetSide || desired;
      await key(side<0?'a':'d');
    }
    snapshot=await state();tree=snapshot.trees.find(t=>t.id===tree.id);
    assert(tree.falling||tree.fallen,'axe sequence must release the trunk');
    if(capture)await page.screenshot({path:path.join(out,`job-${snapshot.level}-fall.png`),fullPage:true});
    await advance(5000);
    snapshot=await state();tree=snapshot.trees.find(t=>t.id===tree.id);
    assert(tree.fallen,'released tree must land');
    assert.equal(Math.sign(tree.angle),desired,'player notch direction must be honored');
  }
  await fellSelected(null,true);
  current=await state();
  assert.equal(current.mode,'levelComplete'); assert.equal(current.levelReport.stars,3);
  assert.equal(current.career.unlocked,2);
  await page.screenshot({path:path.join(out,'06-job-complete.png'),fullPage:true});
  checks.push('axe sequence, 3-star result, career unlock and persistence');
  const jobReports=[current.levelReport];
  // Play through every authored job, including weather, cats, and the boss.
  for(let level=2;level<=5;level++){
    await action('continue'); current=await state();
    assert.equal(current.level,level);
    assert(current.trees.every(t=>t.safeDirections.length>0),`job ${level} is solvable`);
    if(level>=3){
      assert(current.trees.some(tree=>tree.branches.some(branch=>branch.tier==='mid')),'later jobs retain upstream middle branches');
      await action('mid');assert.equal((await state()).activeTier,'mid');
      await key('3');assert.equal((await state()).activeTier,'high');
      await key('1');
    }
    if(level===2){
      assert(current.cat,'second job includes a rescue cat');
      const catTree=current.trees.find(t=>t.id===current.cat.treeId),branch=catTree.branches.find(b=>b.id===current.cat.branchId);
      await tapBranch(branch);
      const afterCat=await state();const guarded=afterCat.trees.find(t=>t.id===catTree.id).branches.find(b=>b.id===branch.id);
      assert(guarded && guarded.hp===branch.hp,'occupied branch must resist damage');
      await action('fiddle');await advance(3200);
      assert.equal((await state()).catRescued,true);assert.equal((await state()).cat,null);
      assert((await state()).score>=current.score+200);
      await action('fiddle');
      await advance(5000);
      await page.screenshot({path:path.join(out,'07-storm-rescue.png'),fullPage:true});
      checks.push('cat branch protection, animated fiddle rescue and reward');
    }
    if(level===5) await page.screenshot({path:path.join(out,'08-heritage-giant.png'),fullPage:true});
    for(let attempts=0;attempts<8;attempts++){
      current=await state();if(current.mode!=='playing')break;
      let tree=selected(current);
      if(!tree||tree.fallen){await key('Tab');continue;}
      await fellSelected(null,level===5&&tree.isBoss);
    }
    current=await state();assert.equal(current.mode,level===5?'victory':'levelComplete',`job ${level} can be won`);
    jobReports.push(current.levelReport);
  }
  await page.screenshot({path:path.join(out,'09-victory.png'),fullPage:true});
  assert.equal((await state()).career.unlocked,5);
  checks.push('all five jobs, stable safe-direction physics, giant encounter, victory');
  await page.reload();await advance(0);assert.equal((await state()).career.unlocked,5);
  await action('board');await page.screenshot({path:path.join(out,'10-career.png'),fullPage:true});
  await action('job-1');
  // A deliberately unsafe axe notch fails immediately; retry resets this same job.
  await fellSelected(1);current=await state();assert.equal(current.mode,'gameover');
  await page.screenshot({path:path.join(out,'11-retry.png'),fullPage:true});
  await action('retry');current=await state();assert.equal(current.mode,'playing');assert.equal(current.level,1);
  assert.equal(current.score,0);assert.equal(current.totals.damagedCount,0);
  assert.equal(current.trees[0].x,330);checks.push('unsafe landing failure and same-job clean retry');
  // Swipe a single branch with the real pointer path and verify health decreases.
  t=selected(current);b=t.branches.find(b=>b.side===1&&b.tier==='low');
  const q=b.segment,box=await page.locator('#game').boundingBox(),x=q.x1+(q.x2-q.x1)*.55,y=q.y1+(q.y2-q.y1)*.55;
  await page.mouse.move(box.x+x*box.width/1280,box.y+(y-28)*box.height/720);await page.mouse.down();
  await page.mouse.move(box.x+x*box.width/1280,box.y+(y+28)*box.height/720,{steps:3});await page.mouse.up();await advance(100);
  const afterSwipe=selected(await state()).branches.find(q=>q.id===b.id);assert(!afterSwipe||afterSwipe.hp<b.hp);
  checks.push('swipe cutting regression');
  // Sound preferences survive reload; real fullscreen contains both canvas and controls.
  await action('sound');assert.equal((await state()).career.sound,false);
  await page.reload();await advance(0);assert.equal((await state()).career.sound,false);
  await action('sound');
  await action('fullscreen');
  await page.waitForFunction(()=>document.fullscreenElement?.id==='game-shell',null,{timeout:5000});
  assert.equal(await page.evaluate(()=>document.fullscreenElement?.id),'game-shell');
  await action('fullscreen');
  await page.waitForFunction(()=>!document.fullscreenElement,null,{timeout:5000});
  checks.push('sound preference persistence and complete fullscreen UI');
  // Small viewport: no document overflow; the control dock remains touchable.
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(out,'12-mobile-menu.png'),fullPage:true});
  await action('board');await action('job-1');
  await page.screenshot({path:path.join(out,'13-mobile-play.png'),fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await action('right');assert(selected(await state()).damagedBranches>0);
  await key('Space');assert.equal((await state()).nick.airborne,true,'Space still jumps after using a focused control');
  const canvasBounds=await page.locator('#game').boundingBox();
  assert(Math.abs(canvasBounds.width/canvasBounds.height-16/9)<.02,'portrait canvas retains world aspect ratio');
  await action('help');await page.screenshot({path:path.join(out,'14-mobile-guide.png'),fullPage:true});
  await key('Escape');
  checks.push('mobile layout and on-screen controls');
  assert.deepEqual(errors, []);
  const report={ok:true,checks,jobReports,consoleErrors:errors};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await browser.close(); server?.close();
})().catch(e => { console.error(e); process.exit(1); });
