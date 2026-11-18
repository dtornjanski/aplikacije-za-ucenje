import os, pathlib, shutil, tempfile, time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.service import Service

url="https://aplikacije-za-ucenje.onrender.com/istrazivaci-naseg-svijeta/index.html"
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
            else: element.send_keys(Keys.ENTER)
            time.sleep(.45)
        try:
            print("Google Chrome",driver.capabilities["browserVersion"],"mobile emulation" if mobile else "desktop")
            press('[data-level="easy"]'); press('[data-lessons="spacetime"]'); press('[data-lesson="sat"]')
            angle=int(float(button('.hand.hour').get_attribute('style').split('rotate(')[1].split('deg')[0]))
            right=f'{(angle//30) or 12:02}:00'
            options=driver.find_elements(By.CSS_SELECTOR,'[data-choice]')
            wrong=next(e.get_attribute('data-value') for e in options if e.get_attribute('data-value')!=right)
            press('[data-choice][data-value="'+wrong+'"]');press('#check-button')
            assert 'Još nije točno' in button('.inline-feedback').text
            time.sleep(2)
            driver.quit();driver=open_browser(profile,mobile)
            assert 'Sat' in button('.resume').text
            press('[data-action="resume"]')
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
