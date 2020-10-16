- ichibot is Officially Integrated with FTX Exchange!  
- ichibot is a powerful tool and can be completely customised by the user (on the fly) to suit whatever your specific trading style is. Our most successful users are aggressive traders. Most likely due to the speed advantages of ichibot. Probably because speed isn't really much of an edge to placing limit orders.  
- Think of it more of a CLI (Command Line Interface) rather than a bot. It doesn't make any of it's own decisions and is 100% under manual control.  
- **[https://ftx.com/#a=ichi](https://ftx.com/#a=ichi)** Anyone religiously using my ref or generous donors will receive *PRIORITY* support, eventually advanced access to new features, hidden/undocumented features and priority new feature requests.  
- You can still add my ref to your account if you haven't made a trade yet. Just go to your [FTX settings](https://ftx.com/profile) and add my ref - **1525075**  
- **[https://twitter.com/ichimikichiki](https://twitter.com/ichimikichiki)**  
- **[https://twitter.com/ichibot](https://twitter.com/ichi)**  
- **[ichibot Community Discord Server](https://discord.gg/yx84w2C)**  
- ichibot is exclusive to FTX Exchange. We won't be supporting other exchanges. Regardless if you offer money or to provide the additional code yourself.  
- This app is still in beta. Please understand this is for testing. Kindly provide some feedback in our Discord if you like or if you have any suggestions. If it's a good suggestion, we'll usually have it done within a few days to a week.  
- ichibot algo is currently under development. It will enable you to create new features yourself, without us having to make any changes the code. Rather than keep everyone in anticipation for algo to be fully complete, we are fast tracking a few algo rules individually for you to use in the mean time. The only one available at the moment is the limit chaser, which was made to test the algo system.  
- If you wish to request a new feature - wait until ichibot algo is out - you will be able to create the feature yourself.  
- If you're on **VIP fees** somewhere else and you used my ref - DM me :)    
- **NEVER message the dev under ANY circumstances.** He is not paid to do the pleb work (customer support). Message ichi instead.  
- Be careful testing New Features. Always use small account balance to start.  
- You can connect a Stream Deck to execute trades - [quick set up video](https://cdn.discordapp.com/attachments/725330804800225324/761147434436263956/stream_deck_discord_example.mov)  
![Stream Deck](https://media.discordapp.net/attachments/725330804800225324/761876510079844362/Capture_decran_2020-10-03_a_17.02.21.png)  

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
  
## Extra Step for MacOS or Linux once downloaded the above   
Go to directory in Terminal `cd Downloads` for example (or just move your ichibot app into your main/root directory) and go into terminal and navigate to directory and type:  

MacOS = `chmod +x ichibot-macos` 
Linux = `chmod +x ichibot-linux`  

To run - just double click.  
Alternatively in terminal window:  
MacOS = `.ichibot-macos`    
Linux = `./ichibot-linux`
Windows = open CMD terminal + drag and drop the ichibot-win.exe into the CMD window  
    
______________________________________________________________________________________________

# Compile yourself manually  (skip if you downloaded the ready to go apps)

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

# API Credentials  
 - You can just make API keys in your ## [settings](https://ftx.com/profile)
- Follow the prompts to type `login` when the app starts for the first time to enter key. **Ignore the random warning you get the first time you run it.**  
- If you're on Windows you probably can't copy & paste. Try right click mouse button then paste. Otherwise just leave the fields blank and it should create a file in your ichibot directory called `ichibot-config-db.json`. Open that in notepad and copy paste your key and secret (and sub-account name if any) in between the "" . Hit save and relaunch ichibot.  
- Your sub-account name is case sensitive - the name top right will display as all-caps which is wrong. Go to your sub-account list for correct case sensitivity of your sub-account.  
- If you generated a key from main account - you can actually access any sub-account by simply specifying the sub-account name.  
- If you generate a key from the sub-account - that key is restricted only for use in that sub-account.    
- API CREDENTIALS are stored in the `ichibot-config-db.json` file if you want to make any manual changes.  
  
# User manual  

### **You really only need to learn a couple of commands to use this bot successfully. Make a few market buy hotkeys (aliases), and just pound them in and out. `buy 1` or `sell 2 11500` etc. There are more advanced functions for later when you get the hang of it - but there's little point trying to learn everything all at once. There isn't anybody who's actually learnt how to use *every* function yet.**   
  
### **Would highly recommend you use the simulation mode by typing `simulation on` and testing out a few orders**  

## Aliases  
An alias is a hotkey or a key that you can save a command to. So that you don't need to type the whole order each time you want to use it. You simply type the hotkey and hit enter and it will execute either a single or multiple order string, depending on what you made it.  

Aliases are a pretty big part of ichibot, and we'll explain them in more detail further down. You might want to think about planning. I put all buys on left side of keyboard, and all sells on the exact opposide right side. So "t" is a sell order and will have the exact opposite order as "y" - the buy order. If I want save the same order but bigger, I just save as a double press or triple press.   

## initrun.txt  

This file `initrun.txt` will be created once you run the bot and save your first alias. It's usually in the same directory as your ichibot app is, or some people have advised it's in the root directory.   

All the aliases are stored in this text file. You can build aliases just by placing them into this text file and hitting save before relaunching ichibot, or you can save directly from the command prompt of ichibot app.  I honestly prefer doing it via the text file, because it's easier to use the mouse to move around and edit stuff. Maybe start by saving a few important hotkeys/aliases that I use often - `alias ca close all` and `alias cc cancel all`. Hit save and your initrun.txt file should now appear, should you wish to use it.  

The initrun.txt file has been updated to separate your aliases *per contract*. When you run the app - it will cycle through your initrun.txt file to load everything in such as aliases, fatfinger etc. To load aliases to separate instruments - type `instrument <instrument-name>` so for eg  

`instrument eth-perp`  
`alias bb buy 5 240`  
`alias ss sell 5 260`  

`instrument btc-perp`  
`alias bb buy 1 9000`  
`alias ss sell 1 9500` 

This will run `instrument eth-perp` as if you typed it in console, and then load the aliases under that instrument and cycle through the whole file loading them all under their respective contracts.  

#### Daily MOVE aliases might prevent your ichibot from loading aliases the next day. As will any contracts that no longer exist or that have a typo.   
Just delete, or change the name of the instrument each day in your `initrun.txt` file, as it will be a new contract name.  So change `btc-move-0721` to `btc-move-0722` etc. Or just delete them and save contracts such as that under Global (instrument *) with specific alias names with say `move` at the start of the alias.    

## Commands  
##### Format  
`buy/sell <size param> <price param>` Example: `buy 0.001 @9000`  
Contract amounts are in the underlying... `buy 1` means buy 1 BTC or 1 ETH, not 1 USD. Don't accidentally long 1000 BTC's instead of $1,000.

#### Please use lower case in ichibot - it does funny things if you type posSize instead of possize.

##### List of Commands:  
| command   | description |
| ------------- | ---------- |
| `buy` / `sell`   | Example: `buy 1 @9000` to place limit order 1 btc @ 9000 or `sell 4` to market sell 4 btc. |
| `alias`   | attach a hotkey to a command or set of commands. Example `alias test sell 4`. And then type `test` to execute the 4 btc market sell order. |
| `fatfinger`   | set a fatfinger. Example: `fatfinger 14`. Needs to be set for each instrument obviously.   |
| `instrument`   | lock to another instrument. Example: `instrument BTC-PERP` or `instrument matic-perp` or `instrument btc-move-0721`. You can find the correct instrument format in the URL on FTX.com. Type `instrument` on it's own to confirm which instrument you are trading in.   |
| `split buy/sell `  | `split buy/sell 25 into 50 from 335 to 360` optional addition `scale 1 to 120` . For now it's set up to scale the order size while we continue working on more complex methods of scaling.  |  
| `tp`   | take profit   |
| `trail`   | trailing stop   |
| `stop`   | Stop Loss (reduce only) for 100% of current **open** position -  `stop @9400` or `stop M+50`. Update: so it's now totally possible to set a delay on placing the stop order with the trigger system. `buy 1 9000, wait close, wait position, stop @9000` or whatever.  |
| `trigger buy/sell`  | Stop loss where you can specify amount - `Trigger buy/sell <size> <price>` Eg. `trigger sell 2 10650`  |
| `trigger trail buy/sell`  | trailing stop that ISN'T reduce only. `trigger trail buy 0.1 +20`  
| `bump +/-`   | bump all orders -/+ the value you choose: `bump +20` to move all orders both buy and sell or `bump buys -10` to specify move only buys or move only sells. **Don't forget the + or - to tell it which way direction to bump them.**  |
| `set ro,` / `set po,`   | set Reduce Only or Post Only to an alias or a serial. Example `set ro, buy 5 9000` or `set po, TestAlias`  |
| `M+25`   | Price Parameter - Market price -/+ value. Example: `M+25` or `M-40` for +25 above Market Price or -40 under current market price.  |
| `%possize`   | use a % of current position size as context. Eg: `buy 100%possize @9000` **Warning: You can't use possize or opensize with Split at this stage**  |
| `%opensize`   | use a % of SUM(current position size + total size of standing limit orders) as the context (opensize = position + aggregate open orders). `buy 50%opensize @9000`.   |
| `%collateral`  | *New Feature* - % of collateral.  |
| `%freecollateral`  |  *New Feature* - % of free collateral.  |
| `%account`  | *New Feature* - % of account balance.  |
| `m-2% m+3%`  | % from market price. `buy 10 m-2.5%` or `sell 10 m+1%`  |
| `chase buy/sell`  | **Risk Warning - Limit Chaser may open bigger position than initially requested.** - `chase buy/sell <amount> <optional offset> min/max` `chase buy 100 max 354.10` - Please note if using chase in a serial order string, it will wait until it's filled/closed, before moving onto the next order in the serial.  |
| `cancel chase`  | *New Feature* - suggest setting a global alias such as `alias ccc cancel chase, cancel limits`. Check the limit order from the chase is cancelled, you may have to manually cancel again.  |
| `cancel chase buy`  | cancel buy chaser  |
| `cancel chase sell`  | cancel sell chaser  |
| `close all`   | close all positions and cancel all orders for the instrument you are locked to.   |
| `cancel all`   | cancel all resting orders inc stops   |
| `cancel limits`   | cancel all resting orders not including stops |
| `cancel stops`   | cancels TP, SL & trailing stop    |
| `cancel buys`  | cancels buy orders  |
| `cancel sells`  | cancels sell orders  |
| `alias list`   | see the list of your saved aliases.   |
| `order list`   | Show open orders. Can specify by instrument. Example `order list` or `order list btc-perp`.   |
| `position list`   | Show open positions. Can also specify by instrument. `position list` or `position list btc-perp`   |  
| `q` | quit   |  
  
# Trigger system
| command   | description  |
| ------------- | ---------- |
|                | ichibot internal triggering system only works while you're connected. Also the relative prices are evaluated when the command is *executed*. For instance if you use 1% from market price, it'll be 1% from when the order is *triggered*, rather than when you are *placing* it  | 
| `wait`  | simply waits the given number of seconds eg `buy 1 11000, wait 7, stop m-1%` - waits 7 seconds after the previous order in a serial order string, before placing the next |
| `wait close`  | waits for the latest *order* to close. And order can close by being filled, rejected or cancelled. It currently only waits for orders posted with the literal buy or sell command (eg can't be used on splits or chase orders. Chase orders don't require this (and cannot accept a wait trigger), since it's hardcoded into the chase system to wait until closed before moving onto the next order. You can ofc still use splits inside the serial order, but just can't use them as *triggers*  |
| `wait fill`  | Wait until previous command is *filled* before continuing. Note this will break the chain completely if you cancel said order, or it'll just wait there indefinitely if it doesn't fill. Note these don't take up **any** margin, as it's all handled internally  |
| `wait position`  | waits until the position on the current instrument is not zero  |
| `wait price >`  | `wait price < 9999, buy 1` - waits for price to hit 9999 before executing the next order - buy 1  |
| `repeat`  | Repeat the series up to the last `;` for eg `wait 5, buy 1, repeat 3` to run once, then repeat another 3 times for a total of 4 runs. Or repeat no specified number to just keep repeating on an infinite loop.  |
| `cmd list`  | Shows a list of your string commands and their status / order  |
| `terminate`  | marks all currently processing commands to be terminated - the immediate commands in execution may still get through but in parallel/serial batches no new commands will be started. Can be used in a serial order string as well. **Does NOT affect chase** - as that's a separate system.  |
| `fuck`  | ichibot safe word. Same as `terminate`, but more appropriate and satisfying when you fuck it up.  |  

# Variable system
| command   | description  |
| ------------- | ---------- |
| `set`  | set assigns the value globally for the current instrument and to the current context.  |
| `let`  | let assigns only to the current context (ie disappears after the command has finished executing.  |
| `check value`  |  prints the value of the current variable  |
|      | `set p 5000` |
|      | `set h 11000` |
|      | `buy p h` - to buy 5000 @11000  |
|      | if var is assigned in multiple places, precedence as follows:  |
| 1st  | Current context  |
| 2nd  | Current instrument  |
| 3rd  | Global instrument  |
|      | Note: a var can be assigned in place of price or size anywhere.  |
| `%var`  | you could use a variable like `50%h` or `10%h`  |
| `var+/-`  | var + or - like `h-50`  |  
    
```
[global *] > set x 0
 ::: set x 0 
Writing command "set x 0" to global initialization steps. 
[global *] > let x x+1, check value x, repeat 10
 ::: let x x+1, check value x, repeat 10 
Processing 3 sub commands in serial 
Value: 1 
Repeating the command "let x x+1, check value x, repeat 10" (#1) 
Value: 2 
Repeating the command "let x x+1, check value x, repeat 10" (#2) 
Value: 3 
Repeating the command "let x x+1, check value x, repeat 10" (#3) 
Value: 4 
Repeating the command "let x x+1, check value x, repeat 10" (#4) 
Value: 5 
Repeating the command "let x x+1, check value x, repeat 10" (#5) 
Value: 6 
Repeating the command "let x x+1, check value x, repeat 10" (#6) 
Value: 7 
Repeating the command "let x x+1, check value x, repeat 10" (#7) 
Value: 8 
Repeating the command "let x x+1, check value x, repeat 10" (#8) 
Value: 9 
Repeating the command "let x x+1, check value x, repeat 10" (#9) 
Value: 10 
Repeating the command "let x x+1, check value x, repeat 10" (#10) 
Value: 11 
[global *] > check value x
 ::: check value x 
Value: 0 
```  
  
## Example commands  
`fatfinger 50`  - do not allow new orders larger than this size  
`buy 1`  
`sell 2`  
`buy 1 @11000`  
`sell 2 @12500`  
`alias d buy 3`  - sets "d" as a hotkey to buy 3 BTC  
`d` - executes a buy market order of 3 btc as per alias set above  
`buy 3 m-10`  - set a limit order of 3 BTC at $10 under current *market* price  
`sell 5 m+100`  - place sell order of 5 BTC $100 above current *market* price  
`buy 1; stop -50`  - buys 1 at market, places a SL trigger 50 points below the *executed* price  
`buy 1; sell 1 +50`  - first market buy 1 BTC, then place limit sell $50 higher  
`buy 5; sell 2.5 M+22; sell 2.5 M+28; stop M-50`   - market buy 5, limit order 2.5 BTC +$22 and 2.5 btc +$28 above current market price and place a stop -$50 below current market price  
`buy 5 10500; trigger sell 5 10000` - sets limit order of 5 btc at 10500 and a stop loss at 10000.  
![screen_shot_2020-07-30](https://gitlab.com/Ichimikichiki/ichibot-wiki/-/wikis/uploads/8c9143bcba53ff872983ffc7561fcc3c/Screen_Shot_2020-07-30_at_2.41.14_am.png)  
## Global Aliases - `instrument *`    
You can set a global alias that can be called in any instrument.  
- It will only affect the instrument you're in.  
- Stick it under `instrument *` in your `initrun.txt` file or
- Type `instrument *` and save the alias from the `[global *] >` prompt.  
- Executing a global alias under a specific instrument such as `[BTC-PERP] >` will *only* affect BTC-PERP.
- Warning: If you *execute* a `close all` or `cancel all` while actually in `instrument *` it will close all your positions / cancel all your orders for any contract / order you have open on all instruments.  

## Example Contract Specific Aliases (in this case for BTC-PERP) and Global Aliases at the end with `instrument *`  
```
instrument btc-perp
alias [ buy 1
alias ] sell 1
alias [[ buy 2
alias ]] sell 2
alias a bump +0.5
alias z bump -0.5
alias aa bump +2.5
alias zz bump -2.5
alias aaa bump +5
alias zzz bump -5
alias y set po, sell 10% +0, sell 10% +1, sell 10% +2, sell 10% +3, sell 10% +4, sell 10% +5, sell 10% +6, sell 10% +7, sell 10% +8, sell 10% +9
alias t set po, buy 10% -0, buy 10% -1, buy 10% -2, buy 10% -3, buy 10% -4, buy 10% -5, buy 10% -6, buy 10% -7, buy 10% -8, buy 10% -9

instrument eth-perp
#### ETH-PERP ALIASES HERE
alias [ buy 10
alias ] sell 10

instrument ada-perp
#### ADA-PERP ALIASES HERE
alias [ buy 100
alias ] sell 100

instrument *
#### GLOBAL ALIASES HERE
alias c cancel limits
alias cs cancel stops
alias cc cancel all
alias ca close all
alias pos position list
alias ol order list
alias ' alias list
alias btc instrument btc-perp
alias eth instrument eth-perp
```  
Added `set PO` to the start of those 10 order serial strings which makes the orders "Post Only". You don't have to, but too many ppl accidentally pressed the wrong way and machine gunned into the order book.  
![Screen_Shot_2020-07-23_at_10.55.28_pm](https://gitlab.com/Ichimikichiki/ichibot-wiki/-/wikis/uploads/6e5d3cc668d45c7ef5ec09a70bdf1707/Screen_Shot_2020-07-23_at_10.55.28_pm.png)  
#### [Example of setting and using an alias in video here](https://www.youtube.com/watch?v=f7xVKQFjkRk)  

## Relative Sizes & Best Practices when making an Alias  
The first time a base price is set, it will not be set again in the series. So if you set the price in an alias call, that's the base price for the whole series. If you do not set the base price in an alias call then the base price will be looked up from the result of the first order, providing a comma has been used to separate the orders. `,`   

Subsequent orders in an alias using `,` in between can all use the % and +5 or +10 and so on.  

- Each parallel command series (separated with `;`) has their own individual base prices specified. However if these are inside an alias then the alias call may "force" set the base price once for all.

The same rules apply to relative order sizes.  

- If you are making an alias of 10 orders - best to make each order 10%, so you will end up specifying the TOTAL position you want to end up with. If you put 100% for each one, you will end up with x10 times the position size you specified, and it makes it less fun.  

## Example  

`buy 1 @8500, sell 1 @8600`  - place two orders to execute one after the other  
`buy 1 @8500; sell 1 @8600`  - place two orders to execute together at the same time  

1.  So you can make an alias with amount and price (or equiv parameter) specified. (Fast to execute, requires a lot of different aliases with various amounts) - Use `;` between orders.
2. Make one where you only have to specify the amount. (Using say `10%` in place of amount) - Use `,` between orders  
3. Make one where you only have to specify the price. (Using say `+0` in place of price) - Use `,` between orders  
4. Make one where you have to specify the amount and the price. - Use `,` between orders   

#### Note: If setting Reduce or Post Only orders, they will affect all orders in a serial up to the `;`, as the `;` break is considered an isolated trade. You will need to `set ro,` again after the `;` if you require. 
`[MATIC-PERP] > set ro, y 112437 0.02488; set ro, y 112437 0.025225`  
  
![Screen_Shot_2020-08-11_at_10.08.47_am](https://gitlab.com/Ichimikichiki/ichibot-wiki/-/wikis/uploads/ab7525c04a17f9125d102f43fafc4115/Screen_Shot_2020-08-11_at_10.08.47_am.png)  

#### Strongly suggest you try a terminal program that opens using a hotkey for quicker access to ichibot **[iTerm2 for MacOS](https://iterm2.com/iTerm2)**. Or on Linux use **[Yakuake for Linux](https://kde.org/applications/en/system/org.kde.yakuake)**. (or [Guake](https://github.com/Guake/guake), [Qterminal](https://github.com/lxqt/qterminal),[Tilda](https://github.com/lanoxx/tilda).  

#### [27min YouTube demonstration of using the bot for some scalping.](https://youtu.be/D8d43GzFzNc) - I designed ichibot for myself as a swing trader, but that'd be pretty boring to watch a demonstration of, so I tried some scalping for this. I'm just watching the orderbook and listening to aggr. No strategy employed. 100% just *feeling it*. Up 14% in that video with 319 fills, and not a single trade closed at a loss.   

#### [Placing orders with Stream Deck](https://twitter.com/ichibot/status/1311364913550426112)
  
#### **Tip Jar:**  
##### BTC - 3NKrq5NYhreY1Fe83rzKWwhtK9hpqkeA7h
##### ETH - 0x278403E3D91Cf3614a3D101E9a7374B51eEE4577
