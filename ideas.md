1. given a stack (prefix), stage, configEnv, and region

   somestack, dev|prod|pr-x, dev|prod|feature, aws-region
   read a config and know

   --stack-name ? could have prefix or not
   --region ? could override region (ses, acm etc)
   --config-env ? could override to global
   --stage ? could override to global

2. same export method in deploy-strategy

   except the matrix would include
   stackName
   region
   configEnv
   stage

3. for build

   ```sh
   npx sam-expand build
   ```

4. for package

   ```sh
   npx sam-expand package \
     --region ? \
     --config-env ? \
     --output-template-file packaged.yaml
   ```

5. for deploy

   ```sh
   npx sam-expand deploy \
     --region ? \
     --config-env ? \
     --stack-name ? \
     --parameter-overrides \
       "Stack=somestack" \
       "Stage=dev" \
       --template-file ./packaged.yaml
   ```

6. for deploy

   ```sh
   npx sam-expand delete \
     --region ? \
     --config-env ? \
     --stack-name ? \
     --no-prompts
   ```

7. input output considerations

   - a stack needs to read the outputs of other stacks in an easy way (cross region needed as well).
   - a stack needs to access these values in pre: post: scripts too.
   - a stack should also be able to access some central settings json.

8. remove stack-stage plugin, seems to weird to manipulate the arguments like it does.
