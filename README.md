# Try the wiki [here for easier to follow user manual](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/home)

  
| | **STEPS TO SET UP ICHIBOT**      |    
| ------------- | ----------  |
| Step 1 | Download ichibot here **[Windows](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-windows) [MacOS](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-osx) and [Linux](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs/artifacts/master/download?job=build-linux)** These are compiled for you by Gitlab directly from the source code. MacOS and Linux users still need to run **chmod +x ichibot-macos** or **chmod +x ichibot-linux** - more detailed instructions further down the page if you need. Just reach out if you're stuck on this.  |
| Step 2 |  Sign up to **[FTX using this link](https://ftx.com/#a=ichi)**  |
| Step 3 |  Follow the instructions to verify your account (by entering your name and stating which country you reside). That will allow you **$9,000 /day** withdrawals. If you wish to KYC either as **[individual](https://help.ftx.com/hc/en-us/articles/360027668192-Individual-Account-KYC)** or **[institution](https://help.ftx.com/hc/en-us/articles/360027668312-Institutional-Account-KYC)**, you can submit docs now or later for unlimited withdrawals. |
| Step 4 |  Follow instructions below to save your API keys. Once saved you should have a **ichibot-config-db-json** file saved in your ichibot directory.  |
| Step 5 |  Set a fatfinger (max *individual* order size). Type **`fatfinger`** space amount (in BTC if you're in BTC-PERP still) `fatfinger 10` - for example to make each individual max order size 10 BTC's. |
| Step 6 |  There is now a simulation mode where you can try out commands. Just type `simulation on` and when you're done type `simulation off` |
| Step 7 |  Make an alias (hotkey). While in **BTC-PERP>** type:  **`alias [ buy 0.001`**  - and hit enter. You should now have an **initrun.txt** file in your ichibot directory. Now to market buy 0.001 btc, just press **[** and enter. |
  
**If you have a need to run multiple instances for whatever reason, you should use separate API keys to avoid errors with your session.**  
 
- [ ]  Ignore this error message on first use - it's normal!

![Screen_Shot_2020-10-09_at_7.47.08_am](https://gitlab.com/Ichimikichiki/ichibot-wiki/-/wikis/uploads/83fe4bdb27221ddd6c94c18fa84a21d2/Screen_Shot_2020-10-09_at_7.47.08_am.png)  
### **That just means the bot hasn't detected your `initrun.txt` file, because you haven't made one yet. More on that on the next page.**  
   
## Extra Step for MacOS or Linux once downloaded the above   
Go to directory in Terminal and navigate to wherever you put ichibot (downloads etc). Or stick ichibot in a folder in your root directory.  
  
**Extra Steps on MacOS or Linux**
  
**MacOS and Linux**  
`cd Downloads` or whatever directory/path ichibot is in  
`chmod +x ichibot-macos` or `chmod +x ichibot-linux`  
  
Then just double click the app to launch  
  
**Windows**
Just double click the app or if that doesn't stay open then open a CMD terminal and drag and drop ichibot-win.exe into the CMD window   
   
      
_______________________________________________________________________________________________________  
   

# Compile yourself manually  (skip to API Credentials if you downloaded the ready to go apps above)

 ### Steps are tested on Ubuntu 18.04 and Ubuntu 20.04 and MacOS 10.15.6. Most have got it to work on Windows also. ###
   
 # All Steps at Once (Quick and Simple)  
 # Copy and paste this whole thing into a terminal window  
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash && export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion && nvm install 12 && npm i -g yarn && git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git && cd ichibot-client-app && yarn install && yarn build && yarn start
```  
That should be it. (Ignore the error when it starts the first time.)  
  
________________________________________________________________________________

   
 # Step-by-step  

  # Install dependencies  
   ## Install node 12 (node version manager)  

   `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash`  

   ### Close and restart your terminal session  

   ## Install Node 12  
   `nvm install 12`  
   `npm i -g yarn`  

   `git clone https://gitlab.com/Ichimikichiki/ichibot-client-app.git`
   ### Enter username + pass to login to gitlab  
      
   # Build app and run  
   `cd ichibot-client-app`  
   `yarn install`  
   `yarn build`  
   `yarn start`  

   # When the time comes to do an update. Do:  
   `git pull`  
   `yarn install`  
   `yarn build`  
   `yarn start`  
      
    
    
______________________________________________________________________________________________
  
# API Credentials  
- You can just make API keys in your FTX [settings](https://ftx.com/profile)  
- Follow the prompts to type `login` when the app starts for the first time to enter key. **Ignore the random warning you get the first time you run it.** - If you're on Windows however, you probably can't copy & paste. Try right click mouse button then paste, otherwise just put a few 00's in the fields and it will spit out a file in the same directory you put the ichibot-client-app in called `ichibot-config-db.json`. Just open that in notepad and you'll find it's super easy to copy paste in between the "" . Hit save and relaunch ichibot and you're away.    
- Important: your **sub-account name is case sensitive** - the name top right will display as all-caps, which is wrong. Go to your sub-account list and check for correct case sensitivity of your sub-account. Enter the name of sub-account. **If you are just using main account - leave sub-account name blank**.  
- If you generated a key **from** main account - you can actually access any sub-account with the same keys by simply changing the sub-account name.  
- If you generated keys **from** the sub-account the keys are restricted to use only in that sub-account.  
   
# [Go To User Manual Wiki Page](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/Home/2-User-Manual)
