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
  
-  [ ] **Do NOT run multiple instances connected to the same account at the same time**
   
## Extra Step for MacOS or Linux once downloaded the above   
Go to directory in Terminal and navigate to wherever you put ichibot (downloads etc). Or stick ichibot in a folder in your root directory.  
  
**Extra Steps on MacOS or Linux**
-  [ ] `cd Downloads` (Or whatever directory ichibot is in)  
-  [ ] `chmod +x ichibot-macos` or `chmod +x ichibot-linux`  
  
Then:
-  [ ] just `double click on the app` to launch 
-  [ ] alternatively type: `./ichibot-macos` or if linux type: `./ichibot-linux`   
  
**Windows**
-  [ ] Just double click the app
-  [ ] however if it opens and closes real quick - then open a cmd (terminal) window, and drag ichibot-win.exe and drop it into the black of the cmd (terminal) window   
-  [ ] can also open cmd window and type: `cd Desktop` (or wherever you put it) and then type: `ichibot-win.exe`  to run it.  
   
      
_______________________________________________________________________________________________________  
 # Compile yourself steps for MacOS and Linux:
 Tested on Ubuntu 18.04 and Ubuntu 20.04 and MacOS 10.15.6. Most have got it to work on Windows also.
   
*If youre on MacOS, you may have to install xcode command line tools*
```yml
xcode-select --install
```
  
#### If you want to compile the git yourself, I've actually made that very very simple to do. You don't need to know anything to do it. Simply copy and paste the following if you're on MacOS or Linux. Copy the whole thing and paste it all at once and hit enter:  
**The `&&` means once that command is done - follow on with this next command automatically**  
  
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash &&
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] \. "$NVM_DIR/nvm.sh" # This loads nvm &&
nvm install 13 &&
npm i -g yarn &&
git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git &&
cd ichibot-client-app &&
yarn install &&
yarn build &&
yarn start
```  
That's it!  
    
To run in the future, you can do the following (one line at a time this time)  
```yml
cd ichibot-client-app
yarn start
```
There are also standalone versions you just made as well called `ichibot-macos` `ichibot-linux` `ichibot-win.exe` in the ichibot-client-app directory.  
  
Type `login` for the API key prompt to set up with your keys (which are stored locally on your machine ONLY, in ichibot-config-db.json).
  
# Go to the [wiki for the user manual](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/home)  
________________________________________________________________________________
# Break-down of what we did above
   
 # Step-by-step  

#### Step 1:  
```yml
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```
#### Step 2:    
```bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```
 #### Step 3:  
```yml
nvm install 12 && npm i -g yarn
git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git
cd ichibot-client-app
yarn install
yarn build
```
#### Start ichibot   
```yml
yarn start
```
# When the time comes to do an _update_.  

Navigate to ichibot folder, probably something like  
  
```yml
cd ichibot-client-app
git pull
yarn install
yarn build
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
