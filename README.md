# Try the wiki [here for easier to follow user manual](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/wikis/home)

# Compile yourself manually  (skip to API Credentials if you downloaded the ready to go apps above)

Steps are tested on Ubuntu 18.04 and Ubuntu 20.04 and MacOS 10.15.6. Most have got it to work on Windows also.

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

## Extra Step for MacOS or Linux once downloaded the above   
Go to directory in Terminal `cd Downloads` for example (or just move your ichibot app into your main/root directory) and go into terminal and navigate to directory and type:  

MacOS = `chmod +x ichibot-macos` 
Linux = `chmod +x ichibot-linux`  

To run - just double click.  
Alternatively in terminal window:  
MacOS = `.ichibot-macos`    
Linux = `./ichibot-linux`
Windows = open CMD terminal + drag and drop the ichibot-win.exe into the CMD window  
  
| Steps to set up ichibot  |    |    
| ------------- | ---------- |
| Step 1: | **[Download ichibot here for Windows/Linux/MacOS](https://gitlab.com/Ichimikichiki/ichibot-client-app/-/jobs)**   from top of the page (latest)  |    
| Step 2: |  Sign up to **[FTX using this link](https://ftx.com/#a=ichi)**  |  
| Step 3: |  Follow the instructions to verify your account (by entering your name and stating which country you reside). That will allow you **$9,000 /day** withdrawals. If you wish to KYC either as **[individual](https://help.ftx.com/hc/en-us/articles/360027668192-Individual-Account-KYC)** or **[institution](https://help.ftx.com/hc/en-us/articles/360027668312-Institutional-Account-KYC)**, you can submit docs now or later for unlimited withdrawals.  |  
| Step 4: |  Follow instructions below to save your API keys. Once saved you should have a **ichibot-config-db-json** file saved in your ichibot directory.  |  
| Step 5: |  Set a fatfinger (max *individual* order size). Type **`fatfinger`** space amount (in BTC if you're in BTC-PERP still). | `fatfinger 10` - for example to make each individual max order size 10 BTC's.  |    
| Step 6: |  Make an alias (hotkey). While in **BTC-PERP>** type:  **`alias [ buy 0.001`**  - and hit enter. You should now have an **initrun.txt** file in your ichibot directory. Now to market buy 0.001 btc, just press **[** and enter.  |    
### **Ignore this error message on first use - it's normal!**  
![Screen_Shot_2020-10-09_at_7.47.08_am](https://gitlab.com/Ichimikichiki/ichibot-wiki/-/wikis/uploads/83fe4bdb27221ddd6c94c18fa84a21d2/Screen_Shot_2020-10-09_at_7.47.08_am.png)  
  
______________________________________________________________________________________________  
  
# API Credentials  
 - You can just make API keys in your ## [settings](https://ftx.com/profile)
- Follow the prompts to type `login` when the app starts for the first time to enter key. **Ignore the random warning you get the first time you run it.**  
- If you're on Windows you probably can't copy & paste. Try right click mouse button then paste. Otherwise just leave the fields blank and it should create a file in your ichibot directory called `ichibot-config-db.json`. Open that in notepad and copy paste your key and secret (and sub-account name if any) in between the "" . Hit save and relaunch ichibot.  
- Your sub-account name is case sensitive - the name top right will display as all-caps which is wrong. Go to your sub-account list for correct case sensitivity of your sub-account.  
- If you generated a key from main account - you can actually access any sub-account by simply specifying the sub-account name.  
- If you generate a key from the sub-account - that key is restricted only for use in that sub-account.    
- API CREDENTIALS are stored in the `ichibot-config-db.json` file if you want to make any manual changes.  