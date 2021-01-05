# Try the wiki [here for easier to follow user manual](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/home)

  
| | **STEPS TO SET UP ICHIBOT**      |    
| ------------- | ----------  |
| Step 1 | Download ichibot here **[Windows](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-windows) [MacOS](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-osx) and [Linux](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-linux)** These are compiled for you by Gitlab directly from the source code. MacOS and Linux users still need to run **chmod +x ichibot-macos** or **chmod +x ichibot-linux** - more detailed instructions further down the page if you need. Just reach out if you're stuck on this.  |
| Step 2 |  Sign up to **[FTX using this link](https://ftx.com/#a=ichi)**  |
| Step 3 |  If you're using Windows - open a terminal window and **drag and drop the app into a terminal window**.  Or it'll likely just close as soon as you try to run it. Also take it **out** of the zip folder and put it on your desktop or somewhere.   |
| Step 4 |  Follow instructions below to save your API keys. Once saved you should have a **ichibot-config-db-json** file saved in your ichibot directory.  |
| Step 5 |  Set a fatfinger (max *individual* order size). Type **`fatfinger`** space amount (in BTC if you're in BTC-PERP still) `fatfinger 10` - for example to make each individual max order size 10 BTC's. |
| Step 6 |  There is now a simulation mode where you can try out commands. Just type `simulation on` and when you're done type `simulation off` |
| Step 7 |  Make an alias (hotkey). While in **BTC-PERP>** type:  **`alias [ buy 0.001`**  - and hit enter. You should now have an **initrun.txt** file in your ichibot directory. Now to market buy 0.001 btc, just press **[** and enter. |
  
**If you have a need to run multiple instances for whatever reason, you should use separate API keys to avoid errors with your session.**  
   
## Extra Step for MacOS or Linux once downloaded the above   
Go to directory in Terminal and navigate to wherever you put ichibot (downloads etc). Or stick ichibot in a folder in your root directory.  
  
**Extra Steps on MacOS or Linux**
  
**MacOS and Linux**  
`cd Downloads` or whatever directory/path ichibot is in  
`chmod +x ichibot-macos` or `chmod +x ichibot-linux`  
  
Then just double click the app to launch  
  
**Windows**
Just double click the app or **if it doesn't stay open then open a terminal window and drag ichibot-win.exe and drop it into the command prompt window   
   
      
_______________________________________________________________________________________________________  
 # Compile yourself steps for MacOS and Linux:
 Tested on Ubuntu 18.04 and Ubuntu 20.04 and MacOS 10.15.6. Most have got it to work on Windows also.
   
To Complete All Steps at Once - Copy and paste this **WHOLE THING** into a terminal window **at once** and hit enter    
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash && 
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm &&
nvm install 12 && npm i -g yarn && git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git && cd ichibot-client-app && yarn install && yarn build && yarn start
```  
That's it!  

Should start within 20 seconds or so and just type login for the prompt to set up with your API keys (which are stored locally on your machine ONLY, in ichibot-config-db.json).
  
________________________________________________________________________________

   
 # Step-by-step  

#### Step 1:  
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```
#### Step 2:    
```
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```
 #### Step 3:  
```
nvm install 12 && npm i -g yarn
git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git
cd ichibot-client-app
yarn install
yarn build
```
#### Start ichibot   
```
yarn start
```
# When the time comes to do an update.  

Navigate to ichibot folder, probably something like  
  
```
cd ichibot-client-app
git pull
yarn install
yarn build
  
```
#### Start ichibot   
```
yarn start
```  
    
______________________________________________________________________________________________
  
# API Credentials  
- You can just make API keys in your FTX [settings](https://ftx.com/profile)  
- Follow the prompts to type `login` when the app starts for the first time to enter key. **Ignore the random warning you get the first time you run it.** - If you're on Windows however, you probably can't copy & paste. Try right click mouse button then paste, otherwise just put a few 00's in the fields and it will spit out a file in the same directory you put the ichibot-client-app in called `ichibot-config-db.json`. Just open that in notepad and you'll find it's super easy to copy paste in between the "" . Hit save and relaunch ichibot and you're away.    
- Important: your **sub-account name is case sensitive** - the name top right will display as all-caps, which is wrong. Go to your sub-account list and check for correct case sensitivity of your sub-account. Enter the name of sub-account. **If you are just using main account - leave sub-account name blank**.  
- If you generated a key **from** main account - you can actually access any sub-account with the same keys by simply changing the sub-account name.  
- If you generated keys **from** the sub-account the keys are restricted to use only in that sub-account.  
- On Binance don't forget to generate keys from your FUTURES Account, and also edit your keys permissions to include "enable futures".  
   
# [Go To Setting Up ichibot Wiki Page](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/Home/1-Setting-up-ichibot)
