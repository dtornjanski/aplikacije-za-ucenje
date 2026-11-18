import os, pathlib, shutil, tempfile, time
import hashlib, urllib.request
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.service import Service

url="https://aplikacije-za-ucenje.onrender.com/istrazivaci-naseg-svijeta/index.html"
for attempt in range(70):
    try:
        with urllib.request.urlopen(url+"?provjera="+str(int(time.time())),timeout=12) as page:
            digest=hashlib.sha256(page.read()).hexdigest()
        if digest==os.environ["EXPECTED_SHA256"]:
            print("Objavljena datoteka potvrđena",digest,flush=True)
            break
    except OSError as err:
        print("Čekam javnu stranicu",type(err).__name__,flush=True)
    time.sleep(5)
else: raise AssertionError("Javno izdanje još ne odgovara očekivanoj datoteci")
def open_browser(profile, mobile=False):
    options=webdriver.ChromeOptions()
    options.binary_location=shutil.which("google-chrome")
    options.add_argument("--user-data-dir="+profile)
    options.add_argument("--force-renderer-accessibility=complete")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-first-run")
    options.add_argument("--lang=hr")
    if mobile: options.add_experimental_option("mobileEmulation",{"deviceMetrics":{"width":360,"height":740,"pixelRatio":2,"touch":True,"mobile":True}})
    driver=webdriver.Chrome(service=Service(shutil.which("chromedriver")),options=options)
    driver.get(url)
    driver.execute_cdp_cmd("Page.bringToFront",{})
    WebDriverWait(driver,25).until(lambda d:d.find_elements(By.CSS_SELECTOR,"[data-level]"))
    return driver
def run(mobile):
    with tempfile.TemporaryDirectory() as profile:
        driver=open_browser(profile,mobile)
        def button(s): return WebDriverWait(driver,10).until(lambda d:d.find_element(By.CSS_SELECTOR,s))
        def press(s):
            element=button(s)
            if mobile:
                driver.execute_script("arguments[0].scrollIntoView({block:'center'});",element)
                box=driver.execute_script("const r=arguments[0].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];",element)
                driver.execute_cdp_cmd("Input.dispatchTouchEvent",{"type":"touchStart","touchPoints":[{"x":box[0],"y":box[1]}]})
                driver.execute_cdp_cmd("Input.dispatchTouchEvent",{"type":"touchEnd","touchPoints":[]})
            else:
                driver.execute_script('arguments[0].focus()',element)
                if 'data-run' in s: time.sleep(2)
                element.send_keys(Keys.ENTER)
            time.sleep(.45)
        try:
            print("Google Chrome",driver.capabilities["browserVersion"],"mobile emulation" if mobile else "desktop")
            press('[data-action="book"]')
            assert len(driver.find_elements(By.CSS_SELECTOR,'[data-unit]'))==41
            driver.find_element(By.CSS_SELECTOR,'.book-group summary').click()
            press('[data-unit="str-6"]')
            assert button('#check-button').get_attribute('disabled')
            press('.brand')
            press('[data-level="easy"]'); press('[data-lessons="spacetime"]'); press('[data-lesson="sat"]')
            angle=int(float(button('.hand.hour').get_attribute('style').split('rotate(')[1].split('deg')[0]))
            right=f'{(angle//30) or 12:02}:00'
            options=driver.find_elements(By.CSS_SELECTOR,'[data-choice]')
            wrong=next(e.get_attribute('data-value') for e in options if e.get_attribute('data-value')!=right)
            press('[data-choice][data-value="'+wrong+'"]');press('#check-button')
            assert 'Još nije točno' in button('.inline-feedback').text
            time.sleep(2)
            driver.quit();driver=open_browser(profile,mobile)
            assert any('Sat' in card.text for card in driver.find_elements(By.CSS_SELECTOR,'.resume'))
            press('[data-run="easy/spacetime/sat/vjezba"]')
            assert button('.choice.selected').get_attribute('data-value')==wrong
            assert button('#check-button').get_attribute('disabled')
            press('[data-choice][data-value="'+right+'"]');press('#check-button')
            assert button('h1').text=='Točno!'
            time.sleep(2)
            press('[data-action="next"]');assert '2 od 5' in button('.progress-text').text
            print('PASS', 'touch' if mobile else 'keyboard', 'wrong, browser restart, restored selection, correct, next')
        finally:
            driver.quit()
run(False)
run(True)
