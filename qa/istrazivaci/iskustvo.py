import hashlib, json, os, pathlib, re, shutil, time, urllib.request
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select, WebDriverWait

root=pathlib.Path(os.environ["RUNNER_TEMP"])/"iskustvo"
root.mkdir(exist_ok=True)
portal="https://aplikacije-za-ucenje.onrender.com/"
app=portal+"istrazivaci-naseg-svijeta/index.html"
metrics={}
opts=webdriver.ChromeOptions()
opts.binary_location=shutil.which("google-chrome")
for arg in ["--headless=new","--disable-dev-shm-usage","--no-first-run","--lang=hr","--force-renderer-accessibility=complete","--window-size=1340,900"]:
    opts.add_argument(arg)
d=webdriver.Chrome(service=Service(shutil.which("chromedriver")),options=opts)
d.implicitly_wait(0.5)
def element(s): return WebDriverWait(d,8).until(lambda v:v.find_element(By.CSS_SELECTOR,s))
def all_(s): return d.find_elements(By.CSS_SELECTOR,s)
def js(script,*args): return d.execute_script(script,*args)
def size(w,h,mobile=False):
    d.execute_cdp_cmd('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':mobile})
    d.execute_cdp_cmd('Emulation.setTouchEmulationEnabled',{'enabled':mobile,'maxTouchPoints':1})
def press(s,keyboard=False):
    e=element(s)
    assert e.is_displayed() and e.is_enabled(),s
    if keyboard: e.send_keys(Keys.ENTER)
    else: e.click()
def tap(e):
    js("arguments[0].scrollIntoView({block:'center'})",e)
    p=js("const r=arguments[0].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}",e)
    d.execute_cdp_cmd("Input.dispatchTouchEvent",{"type":"touchStart","touchPoints":[p]})
    d.execute_cdp_cmd("Input.dispatchTouchEvent",{"type":"touchEnd","touchPoints":[]})
def value(e): return e.get_attribute('data-value')
def geom(selector):
    return js("""const e=document.querySelector(arguments[0]);if(!e)return null;const r=e.getBoundingClientRect(); const s=getComputedStyle(e);return [Math.round(r.top+scrollY),Math.round(r.height),Math.round(r.width),s.color,s.backgroundColor,s.fontSize]""",selector)
def overview():
    return js("""return {url:location.href,h:document.querySelector('h1')?.innerText,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,scrollY:Math.round(scrollY),pageHeight:document.documentElement.scrollHeight,active:document.activeElement?.getAttribute('data-action')||document.activeElement?.className,visibleControls:[...document.querySelectorAll('#app button,#app select,#app summary')].filter(e=>e.getClientRects().length).length}""")
def capture(name):
    time.sleep(.18)
    d.save_screenshot(str(root/(name+'.png')))
    metrics['screen-'+name]=overview()
def levels(l):
    press('.brand');press('[data-level="'+l+'"]')
def lesson(l,w,k):
    levels(l);press('[data-lessons="'+w+'"]');press('[data-lesson="'+k+'"]')
def answer_time():
    angle=float(re.search(r'rotate\(([\d.]+)deg\)',element('.hand.hour').get_attribute('style')).group(1))
    return '%02d:00'%(round(angle/30) or 12)
def choose(v): next(e for e in all_('[data-choice]') if value(e)==v).click()
try:
    d.get(portal);press('a[href*="istrazivaci-naseg-svijeta"]');element('[data-level]')
    metrics['chrome']=d.capabilities['browserVersion']
    with urllib.request.urlopen(app,timeout=20) as response: metrics['live_sha256']=hashlib.sha256(response.read()).hexdigest()
    size(1280,800)
    capture('01-pocetak')
    metrics['home']={s:geom(s) for s in ['[data-level="easy"]','.level-card p','[data-action="book"]']}
    press('[data-level="easy"]',True);capture('02-teme')
    metrics['topics']={'starts':len(all_('[data-world]')),'lessonButtons':len(all_('[data-lessons]')),'mixed':element('[data-world="mix"]').text}
    press('[data-lessons="spacetime"]');capture('03-lekcije');press('[data-lesson="sat"]')
    capture('04-sat');ans=answer_time();wrong=next(value(e) for e in all_('[data-choice]') if value(e)!=ans)
    metrics['before_selection']=element('#check-button').is_enabled()
    choose(wrong);press('#check-button',True);capture('05-pogreska')
    metrics['error']={'message':element('.inline-feedback').text,'button':element('#check-button').is_enabled(),'focus':js("return document.activeElement.className"),'selection':value(element('.choice.selected'))==wrong,'colors':geom('.inline-feedback')}
    press('.brand');d.refresh();element('[data-run]');capture('06-nastavak')
    press('[data-run="easy/spacetime/sat/vjezba"]',True)
    metrics['resumed']=(wrong==value(element('.choice.selected')) and 'Još nije točno' in element('.inline-feedback').text)
    choose(ans);press('#check-button');capture('07-tocno');press('[data-action="next"]')
    for i in range(4):
        choose(answer_time());press('#check-button');press('[data-action="next"]')
    capture('08-rezultat')
    metrics['score']=[e.text for e in all_('.stat')]
    press('[data-action="review"]');metrics['retry']=element('.progress-text').text
    press('.brand');press('[data-action="book"]')
    groups=all_('.book-group');metrics['book-count']=[len(groups),len(all_('[data-unit]'))]
    group=next(g for g in groups if g.find_elements(By.CSS_SELECTOR,'[data-unit="str-58"]'))
    group.find_element(By.TAG_NAME,'summary').click()
    Select(element('#book-level')).select_by_value('hard')
    capture('09-gradivo')
    press('[data-unit="str-58"]');capture('10-vjezba-iz-knjige')
    press('[data-action="book"]')
    metrics['back_catalogue']={'opened':len(all_('.book-group[open]')),'scroll':js("return scrollY"),'level':element('#book-level').get_attribute('value'),'focus':js('return document.activeElement.id')}
    # Arrive through the actual portal, so the browser Back destination is known.
    d.get(portal);press('a[href*="istrazivaci-naseg-svijeta"]')
    press('[data-level="medium"]');press('[data-lessons="spacetime"]');press('[data-lesson="skica"]')
    metrics['before_back']=overview();d.back()
    WebDriverWait(d,10).until(lambda v:v.current_url.rstrip('/')==portal.rstrip('/') or v.find_elements(By.CSS_SELECTOR,'[data-lessons]'))
    metrics['after_back']=overview()
    d.get(app);element('[data-level]')
    size(360,740,True);d.get(app+'#gradivo');time.sleep(.25)
    metrics['sameTabFragment']={'url':d.current_url,'heading':element('h1').text,'groups':len(all_('.book-group'))}
    d.refresh();element('.book-group');metrics['freshFragment']=element('h1').text
    Select(element('#book-level')).select_by_value('hard')
    g=next(g for g in all_('.book-group') if g.find_elements(By.CSS_SELECTOR,'[data-unit="str-58"]'))
    tap(g.find_element(By.TAG_NAME,'summary'));tap(element('[data-unit="str-58"]'));element('.evidence-clue')
    js('window.scrollTo(0,0)')
    capture('11-mob-pitanje')
    metrics['mobileHard']={'question':element('.prompt').text,'claims':[e.text for e in all_('.evidence-clue')],'words':len(element('.question-card').text.split()),'firstAnswer':geom('[data-choice]'),'check':geom('#check-button'),'choiceColors':geom('[data-choice]'),'promptColors':geom('.prompt'),'options':len(all_('[data-choice]'))}
    js("document.querySelector('#check-button').scrollIntoView({block:'end'})")
    capture('12-mob-odgovori')
    size(320,568,True);js('scrollTo(0,0)');metrics['narrow']=overview()
    size(360,740,True)
    lesson('hard','spacetime','skica')
    tiles=[e.text for e in all_('.route-map td')]
    start=next(i for i,t in enumerate(tiles) if 'Škola' in t)
    invalid='lijevo' if start%3==0 else 'desno' if start%3==2 else 'gore' if start<3 else 'dolje'
    js('scrollTo(0,0)');capture('13-mob-skica')
    tap(element('[data-route][data-value="'+invalid+'"]'));capture('14-mob-izvan-karte')
    metrics['invalid_move']={'step':invalid,'selected':len(all_('[data-remove-sequence]')),'positionMarkers':len(all_('.route-map .map-current')),'checkEnabled':element('#check-button').is_enabled(),'feedback':len(all_('.inline-feedback')),'announced':js("return document.querySelector('#announcer').textContent"),'mapLabels':tiles}
    tap(element('[data-remove-sequence]'));metrics['position_after_undo']=len(all_('.route-map .map-current'))
    lesson('medium','health','ruke');tap(element('[data-sort-item]'))
    metrics['sort']={'cards':len(all_('[data-sort-item]')),'visibleGroups':len(all_('[data-sort-zone]')),'inline':js("return !!document.querySelector('[data-sort-zone]')?.closest('.sort-unit')"),'sizes':geom('[data-sort-zone]')};capture('15-razvrstavanje')
    tap(element('[data-sort-zone]'));assert all_('[data-remove-sort]')
    lesson('hard','place','ustanove');tap(element('[data-match-left]'));tap(element('[data-match-right]'));capture('16-spajanje')
    metrics['match']={'pairs':len(all_('[data-remove-pair]')),'removeTarget':geom('[data-remove-pair]')}
    levels('hard');press('[data-world="mix"]');metrics['mixStarted']=element('.progress-text').text
    press('.brand');capture('17-mob-nastavi')
    metrics['mobileHomepage']={s:geom(s) for s in ['[data-level="easy"]','[data-action="book"]','[data-action="resume"]']}
    # Revisit the fresh home page without saved work using a new, independent browser context.
    d.execute_cdp_cmd('Storage.clearDataForOrigin',{'origin':portal.rstrip('/'),'storageTypes':'local_storage'})
    d.get(app);element('[data-level]');capture('18-mob-pocetak')
    metrics['freshMobileHome']={s:geom(s) for s in ['[data-level="easy"]','[data-action="book"]','[data-level="easy"]','.level-card p']}
    d.execute_cdp_cmd('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
    metrics['reducedMotion']=js("return getComputedStyle(document.querySelector('.hero-lumi')).animationDuration")
    print('AUDIT METRICS '+json.dumps(metrics,ensure_ascii=False),flush=True)
finally:
    (root/'mjerenja.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2))
    d.quit()
