### Front-end New Features
1. Added `Endorse Topic` in Topic Tools drop-down menu. Button is activated upon clicked, and the topic will get endorsed.
2. Added Unendorse Topic feature that can undo Endorse Topic action. Will appear and replace Endorse Topic for endorsed topics.
3. Endorsement actions are logged just like other actions, i.e., lock and pin.
4. Added Endorsed tag in topic list (displayed after clicking on a category) for endorsed topics.
5. Configured `topic.json` and `error.json` for correct rendering.
6. Added functionality for green endorsement checkmark to appear upon click of 'Endorse topic' button and disappear upon click of 'Unendorse topic' button
7. Added hover element for green endorsement checkmark to indicate that instructor has endorsed a post
8. Remove limitation on the number of messages allowed to be send in a minute, which we removed the error message that shows up when someone sent multiple messages in the minute

### Front-end New Testing
1. Ensures correct API calls and privileged users have access to this feature.
2. Rendering test is done by user testing. All new features won't trigger explicit errors.
3. Manually tested green endorsement checkmark by building on personal NodeBB account
   - Navigating to Announcements page
   - Click on a post (if no existing post, click New Topic and enter relevant content and submit)
   - Click on Topic Tools and click the menu option that states Endorse Topic
   - Upon clicking on this button, you will see a green checkmark next to the post number
   - When you hover over the green checkmark, you will see a note that says 'An instructor endorsed this post'
   - To unendorse, click on Topic Tools again and click the menu option that states Unendorse Topic
   - The green checkmark will disappear
   - As the feature is visual, these checks are enough to verify its accuracy and that it is working. 
4. To manually that sending mulitiple messages in a minutes is allowed and does not have error message
    - Start Nodebb and manual testing by sending multiple message in a minute to see if the error message still pops up
    - Tested back end testing by letting users to send multiple messages in a minute (message flooding) and the user will be able to send out the messages
    - As the feature is visual, these checks are enough to verify its accuracy and that it is working. Originally, there would have been an error message that would indicate if the feature implemented was working/ not working.
   

### Back-end Features
1. Added API calls for `endorse` and `unendorse` 
2. Configured API response format to include `endorse`
3. Configured routes for `endorse`
4. Remove limitation on the number of messages allowed to be send in a minute, which we disabled the functions that checks message flooding

### Back-end Testing
1. Automated test suite is included in `./test/topic.js`, primarily testing features of endorsement.
   - Checked for user permissions (only admins are able to endorse) and other endorse functionalities.
   - The back-end testing is enough as it covers the core functionalities of all the implemented functions like user permissions, endorsing and unendorsing and provides code coverage for all the newly implemented functions. 
3. Successful API calls are necessary to pass the test case. 
   However, do note that API calls are tested in pre-written test file `./test/api.js` and no modifications are made to it.
   
