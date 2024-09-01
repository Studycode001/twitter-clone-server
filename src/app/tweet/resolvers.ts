import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GraphqlContext } from "../../interface";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/tweet";

const s3Clinet = new S3Client({
    region: process.env.AWS_DEFAULT_REGION
});

const queries = {
    getAllTweets: async () =>
        await TweetService.getAllTweets(),
    getSignedURLForTweet: async (
        parent: any,
        { imageType, imageName }: { imageType: string, imageName: string },
        ctx: GraphqlContext
    ) => {
        if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");

        const allowedImageTypes = [
            "image/jpg", 
            "image/jpeg", 
            "image/png", 
            "image/webp"
        ];
        if (!allowedImageTypes.includes(imageType)){
            console.log(imageType)
            throw new Error("Unsupported url(Image Type)");
        }
        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `upload/${ctx.user.id}/tweets/$${imageName}-${Date.now()}.${imageType}`
        })

        const signedURL = await getSignedUrl(s3Clinet, putObjectCommand);

        return signedURL;
    },
};

const mutations = {
    createTweet: async (
        parent: any,
        { payload }: { payload: CreateTweetPayload },
        ctx: GraphqlContext
    ) => {
        if (!ctx.user) throw new Error("You are not authenticated");
        const tweet = await TweetService.createTweet({
            ...payload,
            userId: ctx?.user?.id
        })
        console.log(tweet);

        return tweet;
    },
};

const extraResolvers = {
    Tweet: {
        author: (parent: Tweet) =>
            UserService.getUserById(parent.authorId),
    },
};

export const resolvers = { mutations, extraResolvers, queries };
